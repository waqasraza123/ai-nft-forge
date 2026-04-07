# AI NFT Forge

AI NFT Forge is a self-hosted, white-label platform for turning uploaded photos into collectible-style AI artwork, curating final outputs, publishing branded collection pages, and later minting onchain.

The repository is organized as a pnpm monorepo and is being delivered in phases with a strong emphasis on production-grade boundaries, durable repo memory, and self-host deployment.

## Status

- Current phase: Phase 2, upload and generation pipeline
- Phase 1 foundation is complete
- The repository already includes authenticated studio flows, source asset intake, queue-backed generation orchestration, generated-output storage, a standalone generation backend, ComfyUI provider support, studio generation history, and authenticated ops diagnostics with rolling owner-scoped metrics and synthesized alerts
- Browser-level smoke coverage now exists for the protected studio asset history flow and authenticated ops diagnostics/retry flow through Playwright
- Minting, collection drafting, and public storefront completion are still in future phases

Authoritative project state lives in:

- `AGENTS.md`
- `docs/project-state.md`
- `docs/_local/current-session.md`

## Repository Structure

- `apps/web`: Next.js App Router application for marketing, studio, public placeholders, health, auth, and ops
- `apps/worker`: BullMQ worker for asynchronous generation processing
- `apps/generation-backend`: standalone generation service behind the worker HTTP contract
- `packages/shared`: shared schemas, env parsing, queue contracts, and storage helpers
- `packages/database`: Prisma schema, repositories, and database helpers
- `packages/ui`: shared UI primitives
- `packages/contracts`: future contract integration surface
- `infra/docker`: local Docker Compose infrastructure
- `docs`: durable product, architecture, deployment, and runbook documentation

## Current Capabilities

- Wallet-authenticated studio session flow
- Signed source asset uploads to private object storage
- Queue-backed generation dispatch with BullMQ and Redis
- Standalone generation backend with deterministic and ComfyUI-backed providers
- Protected generated-asset download intents
- Per-asset generation history, retry, and comparison in the studio
- Authenticated ops queue diagnostics, rolling owner-scoped request windows, and alert synthesis

## Technical Direction

- Next.js App Router with TypeScript
- Node.js worker and backend services with TypeScript
- PostgreSQL with Prisma
- Redis with BullMQ
- S3-compatible object storage with local MinIO
- Docker-first local infrastructure
- Base Sepolia for development and Base Mainnet for production later
- ERC-721 for 1/1 items and ERC-1155 for edition drops later

## Quick Start

### Prerequisites

- Node.js `>=22.17.0`
- pnpm `>=10.11.1`
- Docker Desktop or compatible Docker Compose runtime

### Local Boot

1. Install dependencies.
2. Start local infrastructure.
3. Run database validation and migrations as needed.
4. Start the web app, worker, and generation backend in separate terminals.

Example commands:

```bash
pnpm install
pnpm infra:up
pnpm prisma:validate
pnpm --filter @ai-nft-forge/web dev
pnpm --filter @ai-nft-forge/worker dev
pnpm --filter @ai-nft-forge/generation-backend dev
```

See [local-development.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/runbooks/local-development.md) for the durable local runbook and [service-overview.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/deployment/service-overview.md) for service boundaries.

## Validation

Primary verification commands:

```bash
pnpm format-check
pnpm prisma:validate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @ai-nft-forge/web exec playwright install chromium
pnpm test:smoke
pnpm worker:health
pnpm generation-backend:health
pnpm generation-backend:ready
```

Project-wide validation shortcut:

```bash
pnpm validate
```

## Documentation

- Product direction: [positioning.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/product/positioning.md)
- Product scope: [v1-scope.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/product/v1-scope.md)
- Personas: [personas.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/product/personas.md)
- Architecture phases: [phases.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/architecture/phases.md)
- Routes and jobs: [routes-and-jobs.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/architecture/routes-and-jobs.md)
- Status models: [status-models.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/architecture/status-models.md)
- Architecture decisions: [decisions.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/architecture/decisions.md)
- Deployment boundaries: [service-overview.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/deployment/service-overview.md)
- Local runbook: [local-development.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/docs/runbooks/local-development.md)

## Collaboration

Contributions should preserve the current architectural direction and repo memory conventions.

Before opening substantive changes:

- Read `AGENTS.md`
- Read `docs/project-state.md`
- Read the relevant docs under `docs/architecture`, `docs/product`, and `docs/runbooks`
- Keep changes cohesive and commit-sized
- Prefer reusable modules, strong typing, validation, and explicit error handling
- Avoid destructive git operations and do not overwrite unrelated in-progress work

See [CONTRIBUTING.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/CONTRIBUTING.md) for the contribution and collaboration guide.

## Community Standards

- Code of conduct: [CODE_OF_CONDUCT.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/CODE_OF_CONDUCT.md)
- Security reporting: [SECURITY.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/SECURITY.md)
- Support and communication boundaries: [SUPPORT.md](/Users/mc/development/blockchain/ethereum/ai-nft-forge/SUPPORT.md)

## Roadmap

- Phase 2: upload and generation pipeline
- Phase 3: collection draft system
- Phase 4: contracts and publication
- Phase 5: premium storefront and white-label presentation
- Phase 6: hardening, operations, moderation, reconciliation
- Phase 7: open-source packaging and self-host docs

## Production Expectations

- No secrets in repo memory files or committed docs
- Long-running work stays in worker processes, not request handlers
- PostgreSQL remains the system of record
- Source assets and generated outputs stay private and server-mediated
- Operator controls remain authenticated and owner-scoped until workspace roles exist
- Documentation changes should remain durable, concise, and consistent with landed architecture
