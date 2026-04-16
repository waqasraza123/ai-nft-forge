# Current Session

## Date
2026-04-16

## Current Objective
Add a single `pnpm app:up` command that can boot the full application in one step.

## Current Step
Implemented the root launcher and documented both supported startup modes.

## Changes Applied
- Added `scripts/run-app-up.mjs` as the root application launcher.
- Added `app:up` to the root `package.json` scripts.
- `pnpm app:up` now starts the attached self-host stack in the foreground.
- `pnpm app:up -- --mode=local` now starts local infra, migrations, generation backend, worker, and Next.js dev in one attached command.
- The launcher preserves the existing `DATABASE_MODE=local|neon` behavior and does not add any new database env vars.
- Updated `README.md` and `docs/runbooks/local-development.md` to document the new one-command startup flow and the `--mode=local` variant.

## Notes
- Default mode is `selfhost`.
- The launcher uses `child_process.spawn` and `spawnSync`; no new process-manager dependency was added.
- Local mode prefixes child-process logs for readability.
- Ctrl+C handling:
  - self-host mode runs best-effort compose shutdown
  - local mode stops child processes and runs `pnpm infra:down`
- Unrelated existing worktree formatting drift remains in `apps/web/src/app/(ops)/ops/fleet/ops-fleet-client.tsx` and was not modified by this task.

## Verification
- `node --check scripts/run-app-up.mjs` ✅
- `pnpm app:up -- --mode=unknown` ✅ clear usage error
- `pnpm app:up` ❌ blocked by Docker daemon not running (`/Users/mc/.docker/run/docker.sock` missing)
- `pnpm app:up -- --mode=local` ❌ blocked by Docker daemon not running
- `git diff --check -- package.json README.md docs/runbooks/local-development.md scripts/run-app-up.mjs` ✅
- `pnpm format-check` ❌ blocked by unrelated existing formatting issue in `apps/web/src/app/(ops)/ops/fleet/ops-fleet-client.tsx`

## Changed Files
- `package.json`
- `README.md`
- `docs/runbooks/local-development.md`
- `scripts/run-app-up.mjs`
- `docs/_local/current-session.md`

## Next Action
- Start Docker and rerun `pnpm app:up` and `pnpm app:up -- --mode=local` for full runtime verification.
