#!/usr/bin/env bash

set -euo pipefail

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
repo_root="$(CDPATH= cd -- "${script_dir}/.." && pwd)"

if [[ "${1:-}" == "--" ]]; then
  shift
fi

"${repo_root}/scripts/verify-push.sh"

cd "${repo_root}"
SAFE_PUSH_SKIP_VERIFY=1 git push "$@"
