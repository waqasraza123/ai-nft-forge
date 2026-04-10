# AI NFT Forge

AI NFT Forge is a self-hosted, white-label NFT launch platform for turning uploaded source media into curated AI artwork, publishing branded release pages, moderating generated outputs, and operating the system through authenticated studio and ops surfaces.

The repository ships as a pnpm monorepo with a Next.js control plane, a BullMQ worker, a standalone generation backend, PostgreSQL, Redis, and S3-compatible object storage. It is licensed under Apache-2.0.

## Status

- Phases 1 through 7 are complete, and the first post-phase onchain deployment/minting slice is landed
- Deferred beyond the public release:
  - polished wallet UX and automated transaction submission
  - native checkout and payments
  - multi-brand administration
  - advanced multi-node orchestration
- Durable project memory lives in `AGENTS.md`, `docs/project-state.md`, and the architecture docs under `docs/`

## What Ships

- Wallet-authenticated studio session flow
- Source asset intake with signed private-object uploads
- Queue-backed generation orchestration with retry and history
- Generated-asset moderation with owner-scoped approve/reject/reset controls
- Collection draft curation, review-ready validation, publication, and storefront merchandising
- Public white-label brand and collection storefront routes backed only by saved brand settings and immutable published snapshots
- Contract manifest and token-URI publication routes
- Owner-signed contract deployment intent generation, deployment recording, mint intent generation, and mint ledger recording for published collections
- Authenticated ops diagnostics, persisted observability captures, alert delivery policy, and operator retry controls
- Worker-owned reconciliation with persisted runs and issues, manual run/repair/ignore actions, and `/ops` visibility
- Dockerfiles and a single-node Docker Compose self-host path

## Repository Layout

- `apps/web`: Next.js web app for marketing, studio, public storefront, auth, and `/ops`
- `apps/worker`: BullMQ worker for generation dispatch, observability capture, and reconciliation
- `apps/generation-backend`: standalone generation HTTP service
- `packages/shared`: shared schemas, env parsing, storage helpers, and reconciliation contracts
- `packages/database`: Prisma schema, repositories, and transaction helpers
- `packages/ui`: shared UI primitives
- `packages/contracts`: contract path helpers, supported chain metadata, and a server-only ERC-721 compiler entrypoint
- `infra/docker`: local and self-host Docker Compose stacks
- `docs`: product, architecture, deployment, and runbook documentation

## Quick Start

### Local development

```bash
pnpm install
pnpm infra:up
pnpm db:migrate:deploy
pnpm --filter @ai-nft-forge/generation-backend build
pnpm --filter @ai-nft-forge/worker build
pnpm --filter @ai-nft-forge/web build
pnpm --filter @ai-nft-forge/generation-backend start
pnpm --filter @ai-nft-forge/worker start
pnpm --filter @ai-nft-forge/web dev
```

Use `.env.example` as the starting point. The local runbook is in [docs/runbooks/local-development.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/runbooks/local-development.md).

### Single-node self-host

```bash
cp .env.example .env
pnpm install
pnpm infra:selfhost:up
pnpm infra:selfhost:ps
```

The self-host deployment guide is in [docs/deployment/self-host-docker-compose.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/deployment/self-host-docker-compose.md).

## Validation

```bash
pnpm format-check
pnpm prisma:validate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @ai-nft-forge/web exec playwright install --with-deps chromium
pnpm test:smoke
pnpm worker:health
pnpm generation-backend:health
pnpm generation-backend:ready
pnpm infra:selfhost:config
docker build -f apps/web/Dockerfile .
docker build -f apps/worker/Dockerfile .
docker build -f apps/generation-backend/Dockerfile .
```

## Documentation

- Project state: [docs/project-state.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/project-state.md)
- Phase map: [docs/architecture/phases.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/architecture/phases.md)
- Routes and jobs: [docs/architecture/routes-and-jobs.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/architecture/routes-and-jobs.md)
- Service overview: [docs/deployment/service-overview.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/deployment/service-overview.md)
- Environment reference: [docs/deployment/environment-reference.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/deployment/environment-reference.md)
- Self-host deployment: [docs/deployment/self-host-docker-compose.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/deployment/self-host-docker-compose.md)
- Local development: [docs/runbooks/local-development.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/runbooks/local-development.md)
- Operator runbook: [docs/runbooks/operator-runbook.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/runbooks/operator-runbook.md)
- Troubleshooting: [docs/runbooks/troubleshooting.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/runbooks/troubleshooting.md)
- Release checklist: [docs/release-checklist.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/release-checklist.md)

## Production Notes

- PostgreSQL is the system of record
- Source and generated assets stay private by default; public storefront assets are copied into the public bucket only at publication time
- Public routes read only from saved brand settings and immutable published snapshots
- Onchain deployment and minting stay owner-signed; the repo prepares and records transactions but does not ship server-held private keys
- Moderation, ops, and reconciliation actions remain authenticated and owner-scoped
- This repository targets single-node self-hosting with Docker Compose, not Kubernetes or hosted SaaS

## Community

- Contribution guide: [CONTRIBUTING.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/CONTRIBUTING.md)
- Code of conduct: [CODE_OF_CONDUCT.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/CODE_OF_CONDUCT.md)
- Security policy: [SECURITY.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/SECURITY.md)
- Support policy: [SUPPORT.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/SUPPORT.md)
