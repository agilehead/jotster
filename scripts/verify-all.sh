#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -z "${TSONIC_BIN:-}" ]]; then
  echo "FAIL: TSONIC_BIN is not set. Set it to the tsonic CLI path." >&2
  exit 1
fi

source "${ROOT}/scripts/local-first-party.sh"

overlay_local_first_party_packages "${ROOT}"

cd "${ROOT}"

echo "=== restore ==="
npm run restore

echo "=== build + typecheck ==="
JOTSTER_SKIP_RESTORE=1 npm run build &
build_pid=$!
JOTSTER_SKIP_RESTORE=1 npm run typecheck &
typecheck_pid=$!

status=0
if ! wait "${build_pid}"; then
  status=1
fi
if ! wait "${typecheck_pid}"; then
  status=1
fi
if [[ "${status}" -ne 0 ]]; then
  exit "${status}"
fi

echo "=== test ==="
npm run test:no-build

echo ""
echo "=== ALL VERIFY-ALL CHECKS PASSED ==="
