#!/usr/bin/env bash

set -euo pipefail

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
repo_root="$(CDPATH= cd -- "${script_dir}/.." && pwd)"
build_command="${VERIFY_PUSH_BUILD_COMMAND:-pnpm build}"

echo "[verify-push] Running push verification from ${repo_root}"
echo "[verify-push] Executing: ${build_command}"

cd "${repo_root}"

if ! bash -lc "${build_command}"; then
  echo "[verify-push] Push verification failed. Aborting push." >&2
  exit 1
fi

echo "[verify-push] Push verification passed."
