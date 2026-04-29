#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

PROJECT_DIR="${ROOT}/packages/core/generated"
PROJECT="${PROJECT_DIR}/tsonic.csproj"
OUTDIR="${PROJECT_DIR}/ef-compiled-model"
DIST_DIR="${ROOT}/packages/core/dist/net10.0"
CONFIGURATION="Release"

if [ ! -f "${PROJECT}" ]; then
  echo "error: missing ${PROJECT}"
  echo "run: tsonic generate --project core"
  exit 1
fi

find "${PROJECT_DIR}" -maxdepth 1 -type d -name 'ef-compiled-model*' -exec rm -rf {} +
mkdir -p "${OUTDIR}"
mkdir -p "${DIST_DIR}"

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
  --context "JotsterBootstrapDbContext"

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
