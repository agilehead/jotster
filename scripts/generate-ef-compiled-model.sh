#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

PROJECT_DIR="${ROOT}/packages/core/generated"
PROJECT="${PROJECT_DIR}/tsonic.csproj"
OUTDIR="${PROJECT_DIR}/ef-compiled-model"
DIST_DIR="${ROOT}/packages/core/dist/net10.0"
CREATE_DB_OPTIONS_FILE="${PROJECT_DIR}/db/create-db-options.cs"
DB_CONTEXT_FILE="${PROJECT_DIR}/db/jotster-db-context.cs"
CONFIGURATION="Release"
COMPILED_CONTEXT="JotsterBootstrapDbContext"
COMPILED_MODEL="JotsterBootstrapDbContextModel"

if [ ! -f "${PROJECT}" ]; then
  echo "error: missing ${PROJECT}"
  echo "run: tsonic generate --project core"
  exit 1
fi

rm -rf "${OUTDIR}"
mkdir -p "${OUTDIR}"
mkdir -p "${DIST_DIR}"

if grep -q 'public void OnModelCreating(global::Microsoft.EntityFrameworkCore.ModelBuilder modelBuilder)' "${DB_CONTEXT_FILE}"; then
  python3 - "${DB_CONTEXT_FILE}" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()
needle = "        public void OnModelCreating(global::Microsoft.EntityFrameworkCore.ModelBuilder modelBuilder)\n"
replacement = "        protected override void OnModelCreating(global::Microsoft.EntityFrameworkCore.ModelBuilder modelBuilder)\n"
if needle not in text:
    raise SystemExit(f"error: expected OnModelCreating signature not found in {path}")
path.write_text(text.replace(needle, replacement, 1))
PY
fi

if ! grep -q 'protected override void OnModelCreating(global::Microsoft.EntityFrameworkCore.ModelBuilder modelBuilder)' "${DB_CONTEXT_FILE}"; then
  echo "error: failed to patch OnModelCreating override in ${DB_CONTEXT_FILE}" >&2
  exit 1
fi

dotnet tool restore >/dev/null

pushd "${PROJECT_DIR}" >/dev/null

dotnet restore "tsonic.csproj" >/dev/null

dotnet build "tsonic.csproj" \
  -c "${CONFIGURATION}" \
  -t:Rebuild \
  /p:PublishAot=false \
  /p:EFOptimizeContext=false \
  >/dev/null

dotnet ef dbcontext optimize \
  --no-build \
  --configuration "${CONFIGURATION}" \
  --project "tsonic.csproj" \
  --output-dir "ef-compiled-model" \
  --precompile-queries \
  --nativeaot \
  --namespace "Jotster.Core.db" \
  --context "${COMPILED_CONTEXT}"

if ! grep -q 'protected override void OnConfiguring' "${DB_CONTEXT_FILE}"; then
  python3 - "${DB_CONTEXT_FILE}" "${COMPILED_CONTEXT}" "${COMPILED_MODEL}" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
context_name = sys.argv[2]
model_name = sys.argv[3]
text = path.read_text()
needle = """        public JotsterBootstrapDbContext(global::Microsoft.EntityFrameworkCore.DbContextOptions options, global::Jotster.Core.types.BootstrapContext? bootstrapContext = default) : base(options)\n        {\n            this.Bootstrap = bootstrapContext ?? new global::Jotster.Core.types.BootstrapContext();\n        }\n"""
if needle not in text:
    needle = """        public JotsterBootstrapDbContext(global::Microsoft.EntityFrameworkCore.DbContextOptions options, global::Jotster.Core.types.BootstrapContext? bootstrapContext = default) : base(options)\n        {\n            this.Bootstrap = bootstrapContext;\n        }\n"""
replacement = needle + f"""
        protected override void OnConfiguring(global::Microsoft.EntityFrameworkCore.DbContextOptionsBuilder optionsBuilder)
        {{
            optionsBuilder.UseModel(global::Jotster.Core.db.{model_name}.Instance);
            base.OnConfiguring(optionsBuilder);
        }}
"""
if needle not in text:
    raise SystemExit(f"error: expected {context_name} constructor block not found in {path}")
path.write_text(text.replace(needle, replacement, 1))
PY
fi

if ! grep -q 'protected override void OnConfiguring' "${DB_CONTEXT_FILE}"; then
  echo "error: failed to inject compiled model usage into ${DB_CONTEXT_FILE}" >&2
  exit 1
fi

dotnet build "tsonic.csproj" \
  -c "${CONFIGURATION}" \
  -t:Rebuild \
  /p:PublishAot=false \
  /p:EFOptimizeContext=false \
  >/dev/null

popd >/dev/null

cp "${PROJECT_DIR}/bin/${CONFIGURATION}/net10.0/Jotster.Core.dll" "${DIST_DIR}/Jotster.Core.dll"
if [ -f "${PROJECT_DIR}/bin/${CONFIGURATION}/net10.0/Jotster.Core.xml" ]; then
  cp "${PROJECT_DIR}/bin/${CONFIGURATION}/net10.0/Jotster.Core.xml" "${DIST_DIR}/Jotster.Core.xml"
fi
if [ -f "${PROJECT_DIR}/bin/${CONFIGURATION}/net10.0/Jotster.Core.deps.json" ]; then
  cp "${PROJECT_DIR}/bin/${CONFIGURATION}/net10.0/Jotster.Core.deps.json" "${DIST_DIR}/Jotster.Core.deps.json"
fi
if [ -f "${PROJECT_DIR}/bin/${CONFIGURATION}/net10.0/Jotster.Core.runtimeconfig.json" ]; then
  cp "${PROJECT_DIR}/bin/${CONFIGURATION}/net10.0/Jotster.Core.runtimeconfig.json" "${DIST_DIR}/Jotster.Core.runtimeconfig.json"
fi

echo "✓ EF compiled model generated: packages/core/generated/ef-compiled-model"
