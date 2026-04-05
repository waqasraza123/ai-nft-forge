# Project State

## Product

AI NFT Forge is planned as a self-hosted, white-label product for turning client photos into collectible-style art variants, curating final assets, publishing branded collection pages, and later minting onchain. The repository now contains the completed Phase 1 foundation: the monorepo spine, the web shell, the worker shell, the Prisma-backed database package, the auth nonce/session foundation, Docker-based local infrastructure, and setup docs. Uploads, generation, and minting are still not implemented.

## Current Architecture

The repository now has a pnpm workspace monorepo with Turbo, TypeScript, ESLint, Prettier, GitHub Actions CI, and the expected Phase 1 layout:

- `apps/web`
- `apps/worker`
- `packages/shared`
- `packages/database`
- `packages/ui`
- `packages/config`
- `packages/contracts`
- `infra/docker`

Current implementation status:

- `apps/web` is a real Next.js App Router app with route groups for marketing, studio, public brand collection placeholders, and ops.
- `apps/web` exposes `GET /api/health`.
- `apps/web` now exposes `POST /api/auth/nonce`, `POST /api/auth/verify`, `POST /api/auth/logout`, and `GET /api/auth/session`.
- `apps/web` now protects `/studio` with server-side session lookup and redirects unauthenticated requests to `/sign-in`.
- `apps/worker` is now a real Node.js worker shell with env parsing, Redis connection setup, BullMQ queue registration, a noop processor, graceful shutdown hooks, and a `health` command.
- `packages/ui` provides reusable page-shell and surface primitives used by the web app.
- `packages/shared` now centralizes worker env validation, auth request/response schemas, and auth env parsing.
- `packages/database` now contains the Prisma schema, initial SQL migration, repository helpers, transaction helper, health utility, and PostgreSQL client boundary.
- `infra/docker/docker-compose.yml` now provides local PostgreSQL, Redis, MinIO, and MinIO bucket bootstrap services.
- `.env.example` now documents the current local runtime environment shape.
- `docs/runbooks/local-development.md` and `docs/deployment/service-overview.md` now document boot, verification, and service boundaries.
- Prisma CLI configuration now lives in `packages/database/prisma.config.ts`, matching Prisma 7 requirements.
- The runtime database client uses the PostgreSQL driver adapter and is created lazily from `DATABASE_URL`.
- No upload flow, generation flow, or polished client wallet UI exists yet.

The frozen technical direction remains:

- Next.js App Router with TypeScript for the web app
- Node.js with TypeScript for the worker
- PostgreSQL with Prisma
- Redis with BullMQ
- S3-compatible storage with local MinIO
- Docker-first self-hosted deployment
- Base Sepolia for development and Base Mainnet for production
- OpenZeppelin-based ERC-721 for 1/1 items and ERC-1155 for edition drops later
- ComfyUI with a model adapter architecture later

## Non-Negotiable Rules

- No product features were implemented in this slice.
- No comments in code unless explicitly requested.
- Prefer reusable modules and components over large multi-purpose files.
- Use descriptive and consistent names.
- Write production-grade code with strong typing, validation, and error handling.
- Do not guess missing requirements; state assumptions explicitly.
- Avoid hardcoded values, hacks, and tightly coupled logic.
- Keep repo memory files concise, high-signal, and free of secrets.
- Future Codex sessions must read this file before making implementation decisions.

## Current Roadmap

- Phase 1: foundation
- Phase 2: upload and generation pipeline
- Phase 3: collection draft system
- Phase 4: contracts and publication
- Phase 5: premium storefront and white-label presentation
- Phase 6: hardening, operations, moderation, reconciliation
- Phase 7: open-source packaging and self-host docs

## Completed Major Slices

- Durable repo memory system established with `AGENTS.md`, `docs/project-state.md`, and local session memory conventions.
- Durable planning docs added for product, architecture, routes/jobs, status models, and phased delivery.
- Phase 1 Commit 1 landed the monorepo foundation, root tooling, placeholder workspace packages, local Git initialization, and CI verification workflow.
- Phase 1 Commit 2 landed the Next.js web shell, reusable UI primitives, route-group boundaries, placeholder pages, and the web health endpoint.
- Phase 1 Commit 3 landed the worker shell, shared env and queue definitions, BullMQ registry, noop processor, worker tests, and the worker health command.
- Phase 1 Commit 4 landed the Prisma-backed database package, initial auth and workspace schema, migration baseline, repository helpers, transaction helper, and database health utilities.
- Phase 1 Commit 5 landed the auth nonce/session foundation, auth API routes, shared auth schemas, secure-aware session cookies, tests, and the protected studio shell.
- Phase 1 Commit 6 landed local Docker infrastructure, `.env.example`, setup and deployment docs, root verification commands, CI hardening, and the final Phase 1 handoff updates.
- Phase 1 foundation is now complete and green for the current repo scope.

## Important Decisions

- The repo is being treated as a clean foundation start rather than a partially built application.
- `docs/project-state.md` is the durable source of project context for future sessions.
- `docs/_local/current-session.md` is local restart and handoff memory and should not be committed.
- Phase 1 should focus on repository foundation, baseline architecture, and self-hostable development setup before feature work.
- Product positioning remains B2B white-label first with premium storefront quality as a primary differentiator.
- The monorepo toolchain baseline is pnpm workspaces plus Turbo.
- Shared repo config lives in `packages/config`.
- `apps/web` uses Next.js App Router route groups to keep marketing, studio, public, and ops concerns separate from the start.
- `packages/ui` is the shared UI boundary for reusable shell primitives.
- `packages/shared` is the shared boundary for auth and worker schemas plus env parsing helpers.
- The worker runtime uses BullMQ with Redis and keeps product job families deferred behind a noop foundation queue.
- `packages/database` owns the Prisma schema, migrations, and thin repository boundary for users, auth nonces, auth sessions, workspaces, brands, and audit logs.
- Prisma 7 configuration is handled with `prisma.config.ts`, while the runtime client uses `@prisma/adapter-pg`.
- Wallet authentication now uses a server-issued nonce, a server-reconstructed sign-in message, server-side signature verification, and a database-backed HTTP-only session cookie.
- Local development now uses Docker Compose under `infra/docker` for PostgreSQL, Redis, MinIO, and bucket bootstrap, while the web app and worker continue to run from workspace scripts.
- The local Compose stack uses dedicated host ports so Phase 1 services do not collide with unrelated local PostgreSQL or Redis installs.
- GitHub `origin` is configured and `main` tracks the remote.

## Deferred / Not Yet Implemented

- Redis and BullMQ jobs
- Storage integration
- Base Account integration and polished wallet UI
- Generation pipeline
- Contracts, metadata publication, and minting
- Live storefront data

## Risks / Watchouts

- The web app and worker are not containerized yet; Phase 1 only containers the backing services needed for local reproducibility.
- Browser-level smoke coverage is still deferred. Current coverage relies on build validation plus focused unit and integration tests.
- Planning docs should remain durable; avoid locking in low-level implementation details before the foundation lands.
- `docs/_local/` must stay local-only and must never hold secrets.

## Standard Verification

- `ls -la`
- `find . -maxdepth 3 -type f | sort`
- `pnpm install`
- `pnpm format-check`
- `pnpm prisma:validate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm worker:health`
- `pnpm infra:config`
- `pnpm infra:ps`
- `DATABASE_URL='postgresql://ai_nft_forge:ai_nft_forge@127.0.0.1:55432/ai_nft_forge?schema=public' pnpm db:migrate:status`
