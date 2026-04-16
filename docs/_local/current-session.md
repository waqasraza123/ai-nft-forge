# Current Session

## Date
2026-04-16

## Current Objective
Implement explicit optional Neon Postgres support without disturbing the existing Docker-first PostgreSQL default.

## Current Step
Database mode support is implemented and verified as far as the local environment allows.

## Changes Applied
- Added centralized database mode resolution in `packages/database/src/database-mode.ts` plus tests in `packages/database/src/database-mode.test.ts`.
- Updated `packages/database/src/client.ts`, `packages/database/src/health.ts`, `packages/database/src/health.test.ts`, `packages/database/src/index.ts`, and `packages/database/prisma.config.ts` to use the centralized resolver for runtime and Prisma URL selection.
- Added mode-aware compose selection in `scripts/run-compose.mjs` and switched root `infra:*` and `infra:selfhost:*` scripts in `package.json` to use it.
- Added `infra/docker/docker-compose.neon.yml` and `infra/docker/docker-compose.selfhost.neon.yml` so Neon mode omits PostgreSQL while keeping Redis and MinIO.
- Pinned browser smoke to local mode in `scripts/browser-smoke-env.mjs`.
- Updated `.env.example`, `README.md`, and the local/self-host/environment docs for the explicit `DATABASE_MODE` contract.

## Notes
- Default behavior remains the existing Docker/local PostgreSQL path when `DATABASE_MODE` is unset or `local`.
- Neon mode switches only when `DATABASE_MODE=neon`; the presence of Neon URLs alone does not change behavior.
- Prisma Neon behavior is split explicitly:
  - `DATABASE_NEON_URL` for runtime access
  - `DATABASE_NEON_DIRECT_URL` for Prisma deploy/status work
  - `DATABASE_NEON_SHADOW_URL` only for `prisma migrate dev`
- Browser smoke remains pinned to `DATABASE_MODE=local`.
- Unrelated existing worktree changes in `apps/generation-backend`, `apps/worker`, and `packages/shared` were not modified by this task.

## Verification
- `pnpm --filter @ai-nft-forge/database test` ✅
- `pnpm prisma:validate` ✅
- `DATABASE_MODE=neon DATABASE_NEON_URL='postgresql://neon:neon@127.0.0.1:1/forge?sslmode=require' DATABASE_NEON_DIRECT_URL='postgresql://neon:neon@127.0.0.1:1/forge?sslmode=require' pnpm prisma:validate` ✅
- `pnpm typecheck` ✅
- `pnpm test` ✅
- `pnpm build` ✅
- `pnpm infra:config` ✅ local config still includes PostgreSQL
- `DATABASE_MODE=neon ... pnpm infra:config` ✅ Neon local config omits PostgreSQL
- `pnpm infra:selfhost:config` ✅ self-host default still includes PostgreSQL
- `DATABASE_MODE=neon ... pnpm infra:selfhost:config` ✅ Neon self-host config omits PostgreSQL and injects Neon env
- `DATABASE_MODE=neon node -e "import('./scripts/browser-smoke-env.mjs').then(({ resolveBrowserSmokeEnvironment }) => { process.stdout.write(resolveBrowserSmokeEnvironment().DATABASE_MODE + '\n'); })"` ✅ returned `local`
- `pnpm infra:up` ❌ blocked by local Docker daemon not running (`/Users/mc/.docker/run/docker.sock` missing)
- `DATABASE_MODE=neon ... pnpm infra:up` ❌ blocked by local Docker daemon not running
- `pnpm db:migrate:status` ❌ resolver selected local PostgreSQL correctly but schema engine could not connect because local PostgreSQL was not running
- `pnpm db:migrate:deploy` ❌ resolver selected local PostgreSQL correctly but schema engine could not connect because local PostgreSQL was not running
- `DATABASE_MODE=neon ... pnpm db:migrate:status` ❌ resolver selected Neon URLs correctly but live connectivity was intentionally pointed at `127.0.0.1:1` as a safe credential-free probe
- `DATABASE_MODE=neon ... pnpm db:migrate:deploy` ❌ resolver selected Neon URLs correctly but live connectivity was intentionally pointed at `127.0.0.1:1` as a safe credential-free probe
- `DATABASE_MODE=neon ... DATABASE_NEON_SHADOW_URL='postgresql://neon:neon@127.0.0.1:1/forge_shadow?sslmode=require' pnpm --filter @ai-nft-forge/database prisma:migrate:dev --create-only --name neon-mode-probe` ❌ command advanced past config validation and failed only at the expected connection attempt

## Changed Files
- `.env.example`
- `README.md`
- `docs/deployment/environment-reference.md`
- `docs/deployment/self-host-docker-compose.md`
- `docs/project-state.md`
- `docs/runbooks/local-development.md`
- `infra/docker/docker-compose.neon.yml`
- `infra/docker/docker-compose.selfhost.neon.yml`
- `package.json`
- `packages/database/prisma.config.ts`
- `packages/database/src/client.ts`
- `packages/database/src/database-mode.test.ts`
- `packages/database/src/database-mode.ts`
- `packages/database/src/health.test.ts`
- `packages/database/src/health.ts`
- `packages/database/src/index.ts`
- `scripts/browser-smoke-env.mjs`
- `scripts/run-compose.mjs`
- `docs/_local/current-session.md`

## Verification Commands
- `pnpm --filter @ai-nft-forge/database test`
- `pnpm prisma:validate`
- `DATABASE_MODE=neon DATABASE_NEON_URL='postgresql://neon:neon@127.0.0.1:1/forge?sslmode=require' DATABASE_NEON_DIRECT_URL='postgresql://neon:neon@127.0.0.1:1/forge?sslmode=require' pnpm prisma:validate`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm infra:config`
- `DATABASE_MODE=neon DATABASE_NEON_URL='postgresql://neon:neon@127.0.0.1:1/forge?sslmode=require' DATABASE_NEON_DIRECT_URL='postgresql://neon:neon@127.0.0.1:1/forge?sslmode=require' pnpm infra:config`
- `pnpm infra:selfhost:config`
- `DATABASE_MODE=neon DATABASE_NEON_URL='postgresql://neon:neon@127.0.0.1:1/forge?sslmode=require' DATABASE_NEON_DIRECT_URL='postgresql://neon:neon@127.0.0.1:1/forge?sslmode=require' DATABASE_NEON_SHADOW_URL='postgresql://neon:neon@127.0.0.1:1/forge_shadow?sslmode=require' pnpm infra:selfhost:config`
- `DATABASE_MODE=neon node -e "import('./scripts/browser-smoke-env.mjs').then(({ resolveBrowserSmokeEnvironment }) => { process.stdout.write(resolveBrowserSmokeEnvironment().DATABASE_MODE + '\n'); })"`
- `pnpm infra:up`
- `DATABASE_MODE=neon DATABASE_NEON_URL='postgresql://neon:neon@127.0.0.1:1/forge?sslmode=require' DATABASE_NEON_DIRECT_URL='postgresql://neon:neon@127.0.0.1:1/forge?sslmode=require' pnpm infra:up`
- `pnpm db:migrate:status`
- `pnpm db:migrate:deploy`
- `DATABASE_MODE=neon DATABASE_NEON_URL='postgresql://neon:neon@127.0.0.1:1/forge?sslmode=require' DATABASE_NEON_DIRECT_URL='postgresql://neon:neon@127.0.0.1:1/forge?sslmode=require' pnpm db:migrate:status`
- `DATABASE_MODE=neon DATABASE_NEON_URL='postgresql://neon:neon@127.0.0.1:1/forge?sslmode=require' DATABASE_NEON_DIRECT_URL='postgresql://neon:neon@127.0.0.1:1/forge?sslmode=require' pnpm db:migrate:deploy`
- `DATABASE_MODE=neon DATABASE_NEON_URL='postgresql://neon:neon@127.0.0.1:1/forge?sslmode=require' DATABASE_NEON_DIRECT_URL='postgresql://neon:neon@127.0.0.1:1/forge?sslmode=require' DATABASE_NEON_SHADOW_URL='postgresql://neon:neon@127.0.0.1:1/forge_shadow?sslmode=require' pnpm --filter @ai-nft-forge/database prisma:migrate:dev --create-only --name neon-mode-probe`

## Verification Results
- All code-level verification passed: database tests, repo typecheck, repo tests, repo build, local Prisma validate, and Neon Prisma validate.
- Compose selection is correct in both directions:
  - default/local mode still resolves to PostgreSQL-backed local and self-host stacks
  - explicit Neon mode resolves to PostgreSQL-free local and self-host stacks
- Browser smoke remains explicitly pinned to local mode.
- Full local runtime verification is blocked by Docker not running on this machine.
- Full live Neon migration verification is blocked by the lack of real Neon credentials in-session; config path and gating were verified with safe loopback probe URLs.

## Next Action
- If needed, rerun `pnpm infra:up`, `pnpm db:migrate:status`, and `pnpm db:migrate:deploy` after Docker is running for local mode, then rerun the Neon migration commands with real Neon credentials to complete live connectivity verification.
