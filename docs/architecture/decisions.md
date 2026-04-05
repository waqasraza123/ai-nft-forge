# Decisions

## Confirmed

- Build for B2B white-label deployment first.
- Keep the product self-hostable and Docker-first.
- Use Next.js App Router with TypeScript for the web surface.
- Use Node.js with TypeScript for background workers.
- Use PostgreSQL with Prisma for data.
- Use Redis with BullMQ for queueing.
- Use S3-compatible object storage, with MinIO for local development.
- Target Base Sepolia for development and Base Mainnet for production later.
- Plan for ERC-721 for 1/1 items and ERC-1155 for edition drops later.
- Treat ComfyUI as the future generation backend behind an adapter layer.

## Confirmed Repository Decisions

- Keep durable project memory in `docs/project-state.md`.
- Keep local session memory in `docs/_local/current-session.md`.
- Keep `docs/_local/` ignored.
- Do not treat unimplemented architecture as delivered functionality.
- Use a pnpm workspace monorepo with Turbo task orchestration.
- Use TypeScript 6, ESLint flat config, and Prettier as the initial repo tooling baseline.
- Keep the initial Phase 1 workspace shape under `apps/*`, `packages/*`, `infra/docker`, `.github/workflows`, and `docs/*`.
- Keep `packages/config` as the shared boundary for reusable lint, prettier, and package tsconfig presets.
- Use GitHub Actions for the initial verify pipeline.
- Keep Prisma schema files in `packages/database/prisma`, and use `packages/database/prisma.config.ts` plus `@prisma/adapter-pg` for the PostgreSQL client boundary.
- Keep auth server-verified and session-based: the server issues the nonce, reconstructs the signed message, verifies the signature, and stores the session in the database.
- Use Docker Compose under `infra/docker` for local PostgreSQL, Redis, and MinIO infrastructure.
- Keep application processes outside Docker in Phase 1: `apps/web` and `apps/worker` run from workspace scripts, while Compose handles backing services only.
- Bootstrap MinIO buckets with a dedicated `minio-init` one-shot service so the local object storage boundary is reproducible.
- Use dedicated non-default host ports for local infrastructure so the Phase 1 stack does not silently connect to an unrelated local PostgreSQL or Redis service.

## Intentionally Deferred

- Auth provider implementation details
- IPFS pinning implementation details
