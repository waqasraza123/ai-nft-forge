# Project State

## Product

AI NFT Forge is planned as a self-hosted, white-label product for turning client photos into collectible-style art variants, curating final assets, publishing branded collection pages, and later minting onchain. The repository now contains the Phase 1 monorepo foundation, the web shell, the worker shell, the initial Prisma-backed database package, and the first real auth nonce/session foundation. Uploads, generation, and minting are still not implemented.

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
- Prisma CLI configuration now lives in `packages/database/prisma.config.ts`, matching Prisma 7 requirements.
- The runtime database client uses the PostgreSQL driver adapter and is created lazily from `DATABASE_URL`.
- No Docker Compose stack, upload flow, generation flow, or client wallet UI exists yet.

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
- GitHub `origin` is configured and `main` tracks the remote.

## Deferred / Not Yet Implemented

- Redis and BullMQ jobs
- Storage integration
- Docker and local orchestration
- Base Account integration and polished wallet UI
- Generation pipeline
- Contracts, metadata publication, and minting
- Live storefront data
- Local setup docs

## Risks / Watchouts

- The worker shell assumes a reachable Redis instance at runtime, but local infrastructure is still deferred to a later Phase 1 commit.
- The database package validates and generates cleanly without a live PostgreSQL instance, but real database connectivity smoke remains deferred until local Postgres lands in Phase 1 Commit 6.
- The auth API and protected studio route depend on `DATABASE_URL` at runtime when a session lookup or nonce write is required. Local infrastructure still lands in Phase 1 Commit 6.
- Planning docs should remain durable; avoid locking in low-level implementation details before the foundation lands.
- `docs/_local/` must stay local-only and must never hold secrets.

## Standard Verification

- `ls -la`
- `find . -maxdepth 3 -type f | sort`
- `pnpm install`
- `pnpm --filter @ai-nft-forge/database prisma:validate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm --filter @ai-nft-forge/worker health`
- `pnpm format-check`
