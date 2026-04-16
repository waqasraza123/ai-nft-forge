# Current Session

## Date
2026-04-16

## Current Objective
Add a true no-Docker cloud-backed mode for `pnpm app:up` while preserving the current Docker-backed path exactly as the default.

## Changes Applied
- Added `scripts/runtime-environment.mjs` to centralize `APP_RUNTIME_MODE=docker|cloud` resolution, merged repo-root env loading, and cloud-mode preflight validation.
- Updated `scripts/run-app-up.mjs` so:
  - default Docker behavior stays unchanged
  - `APP_RUNTIME_MODE=cloud` bypasses Docker and Compose entirely
  - cloud mode requires `DATABASE_MODE=neon`
  - cloud mode runs migrations, builds generation backend and worker, then starts generation backend, worker, and web locally
  - cloud mode rejects `--mode=selfhost`
- Kept browser smoke pinned to the Docker/local path by setting `APP_RUNTIME_MODE=docker` and `DATABASE_MODE=local` in `scripts/browser-smoke-env.mjs`.
- Added `S3_PUBLIC_BASE_URL` to the shared storage env contract and updated public asset URL generation to prefer it when present while preserving the current MinIO fallback when absent.
- Updated the runtime collection service to pass `S3_PUBLIC_BASE_URL` through the existing S3-compatible public URL helper.
- Updated `.env.example`, `README.md`, `docs/runbooks/local-development.md`, `docs/deployment/environment-reference.md`, and `docs/deployment/self-host-docker-compose.md` to document:
  - default Docker mode
  - explicit cloud mode
  - required Neon + Upstash + R2 envs
  - one-time provider provisioning
  - the honest scope: local processes plus hosted dependencies only
- Updated `docs/project-state.md` with the durable `APP_RUNTIME_MODE` and `S3_PUBLIC_BASE_URL` contract.

## Verification
- `node --check scripts/run-app-up.mjs` ✅
- `node --check scripts/runtime-environment.mjs` ✅
- `pnpm --filter @ai-nft-forge/shared test` ✅
- `pnpm --filter @ai-nft-forge/database test` ✅
- `pnpm prisma:validate` ✅
- `DATABASE_MODE=neon DATABASE_NEON_URL='postgresql://forge:forge@ep-runtime.us-east-1.aws.neon.tech/forge?sslmode=require' DATABASE_NEON_DIRECT_URL='postgresql://forge:forge@ep-direct.us-east-1.aws.neon.tech/forge?sslmode=require' pnpm prisma:validate` ✅
- `pnpm typecheck` ✅
- `pnpm build` ✅
- `node --input-type=module -e "import { resolveBrowserSmokeEnvironment } from './scripts/browser-smoke-env.mjs'; ..."` ✅ returned `APP_RUNTIME_MODE=docker` and `DATABASE_MODE=local`
- `APP_RUNTIME_MODE=cloud DATABASE_MODE=local node scripts/run-app-up.mjs` ✅ clear failure before startup
- `APP_RUNTIME_MODE=cloud DATABASE_MODE=neon ... node scripts/run-app-up.mjs --mode=selfhost` ✅ clear failure before startup
- `APP_RUNTIME_MODE=cloud DATABASE_MODE=neon ... node scripts/run-app-up.mjs` ✅ reached `pnpm db:migrate:deploy` and failed on Prisma connectivity instead of invoking Docker
- `APP_RUNTIME_MODE=cloud DATABASE_MODE=neon ... pnpm --filter @ai-nft-forge/database prisma:migrate:dev --create-only` ✅ reached Prisma migrate-dev gating and failed only on live schema-engine/database connectivity

## Verification Limits
- Full live Neon/Upstash/R2 verification remains credential-blocked.
- Default Docker runtime verification remains blocked unless Docker daemon is running locally.

## Changed Files
- `.env.example`
- `README.md`
- `apps/web/src/server/collections/runtime.ts`
- `docs/deployment/environment-reference.md`
- `docs/deployment/self-host-docker-compose.md`
- `docs/project-state.md`
- `docs/runbooks/local-development.md`
- `packages/shared/src/env/storage-env.test.ts`
- `packages/shared/src/env/storage-env.ts`
- `packages/shared/src/object-storage.test.ts`
- `packages/shared/src/object-storage.ts`
- `scripts/browser-smoke-env.mjs`
- `scripts/run-app-up.mjs`
- `scripts/runtime-environment.mjs`
- `docs/_local/current-session.md`

## Next Action
- Commit and push the no-Docker cloud runtime mode once `git diff --check` is clean.
