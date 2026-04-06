# Project State

## Product

AI NFT Forge is planned as a self-hosted, white-label product for turning client photos into collectible-style art variants, curating final assets, publishing branded collection pages, and later minting onchain. The repository now contains the completed Phase 1 foundation plus the first six Phase 2 slices: storage-backed source asset intake, queue-backed generation orchestration, durable generated-output persistence, the first external-backend plus protected-download boundary, the first interactive browser workflow for upload, dispatch, polling, and retrieval, and a concrete standalone generation backend service behind the worker HTTP contract. Minting is still not implemented.

## Current Architecture

The repository now has a pnpm workspace monorepo with Turbo, TypeScript, ESLint, Prettier, GitHub Actions CI, and the expected Phase 1 layout:

- `apps/web`
- `apps/worker`
- `apps/generation-backend`
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
- `apps/web` now exposes an interactive `/studio/assets` browser workflow plus `GET /api/studio/assets`, `POST /api/studio/assets/upload-intents`, `POST /api/studio/assets/[assetId]/complete`, `POST /api/studio/generations`, and `POST /api/studio/generated-assets/[generatedAssetId]/download-intent` for source asset intake, generation dispatch, polling, and protected generated-output retrieval.
- `apps/worker` is now a real Node.js worker shell with env parsing, PostgreSQL, Redis, and object-storage connection setup, BullMQ queue registration, generation request processing, selectable generation adapters (`storage_copy` or `http_backend`), a noop processor, graceful shutdown hooks, and a `health` command.
- `apps/generation-backend` is now a real Node.js service that implements the worker HTTP generation contract, validates bearer auth when configured, reads source objects from private storage, renders transformed PNG variants, writes them back to private storage, exposes `GET /health`, and cleans up partial outputs on failure.
- `packages/ui` provides reusable page-shell and surface primitives used by the web app.
- `packages/shared` now centralizes worker env validation, auth request/response schemas, storage env parsing, reusable object-storage helpers, source asset upload contracts, generation request contracts, generated asset contracts, and queue payload definitions.
- `packages/database` now contains the Prisma schema, initial SQL migration, repository helpers, transaction helper, PostgreSQL client boundary, and the first `SourceAsset`, `GenerationRequest`, and `GeneratedAsset` models and repositories.
- `infra/docker/docker-compose.yml` now provides local PostgreSQL, Redis, MinIO, and MinIO bucket bootstrap services.
- `.env.example` now documents the current local runtime environment shape.
- `docs/runbooks/local-development.md` and `docs/deployment/service-overview.md` now document boot, verification, and service boundaries.
- Prisma CLI configuration now lives in `packages/database/prisma.config.ts`, matching Prisma 7 requirements.
- The runtime database client uses the PostgreSQL driver adapter and is created lazily from `DATABASE_URL`.
- The first source asset intake slice uses server-issued signed uploads into the private object-storage bucket plus explicit upload completion verification.
- The generation pipeline now uses persisted `GenerationRequest` and `GeneratedAsset` records, dispatches BullMQ jobs from the web app, and lets the worker either materialize generated outputs internally or validate artifacts produced by an external HTTP backend before transactionally marking requests succeeded.
- Generated outputs now have a protected owner-scoped download-intent contract that issues short-lived signed storage URLs after database ownership and object existence checks.
- The first operator-facing browser client now drives the full upload, generation dispatch, polling, and retrieval workflow from `/studio/assets` while keeping large object transfers on signed storage URLs and long-running work in the worker.
- No model-backed image generation service or polished client wallet UI exists yet.

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
- Phase 2 Commit 1 landed the `SourceAsset` schema, shared storage and source asset contracts, protected upload-intent and upload-complete routes, storage-backed web service logic, and the first `/studio/assets` surface.
- Phase 2 Commit 2 landed the `GenerationRequest` schema, shared generation and queue contracts, the protected generation dispatch route, studio asset generation status surfacing, and worker-backed lifecycle processing for generation requests.
- Phase 2 Commit 3 landed the `GeneratedAsset` schema, shared generated asset and object-storage contracts, a storage-backed generation adapter, transactional generated output persistence, and studio surfacing for stored generated outputs.
- Phase 2 Commit 4 landed selectable worker generation adapters, the external HTTP backend contract, protected generated-asset download intents, and the first owner-scoped retrieval boundary for stored outputs.
- Phase 2 Commit 5 landed the first interactive studio asset client with multi-file upload, explicit upload verification, per-asset generation dispatch controls, active-job polling, and generated-output download actions.
- Phase 2 Commit 6 landed the standalone generation backend service, shared backend env and storage primitives, real transformed output rendering, backend health reporting, and local runtime wiring for worker-to-backend generation.

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
- Source asset intake now uses server-issued signed `PUT` uploads into the private bucket plus an explicit completion call that verifies object existence before database state changes to `uploaded`.
- The first source asset intake slice is user-owned because the studio shell does not yet expose workspace-bound upload context.
- The first generation orchestration slice uses a persisted `GenerationRequest` record as the system of record for queue lifecycle, with the web app dispatching BullMQ jobs and the worker owning state transitions and result summaries.
- The first generated-output slice uses a private-bucket adapter boundary that can either copy source assets deterministically or validate artifacts produced by an external HTTP backend, and it only marks a generation succeeded after `GeneratedAsset` rows are committed.
- The first browser workflow should orchestrate control-plane actions only: request signed upload and download intents, confirm uploads explicitly, dispatch generation jobs, and poll read models without moving long-running work or private object bytes through the Next.js server.
- The first concrete generation backend should remain standalone behind the existing HTTP contract so the deterministic transformation implementation can later be replaced by a model-backed service without reopening worker, web, or database boundaries.
- GitHub `origin` is configured and `main` tracks the remote.

## Deferred / Not Yet Implemented

- Base Account integration and polished wallet UI
- Model-backed generation implementation behind the new HTTP service contract
- Contracts, metadata publication, and minting
- Live storefront data

## Risks / Watchouts

- The web app and worker are not containerized yet; Phase 1 only containers the backing services needed for local reproducibility.
- The browser workflow is now real, but browser-level smoke coverage is still deferred. Current coverage relies on build validation, focused unit tests, and API/service tests rather than end-to-end automation.
- The repository now ships a concrete generation backend service, but it currently produces deterministic transformed variants rather than true model inference from a system such as ComfyUI.
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
- `pnpm generation-backend:health`
- `pnpm infra:config`
- `pnpm infra:ps`
- `DATABASE_URL='postgresql://ai_nft_forge:ai_nft_forge@127.0.0.1:55432/ai_nft_forge?schema=public' pnpm db:migrate:status`
