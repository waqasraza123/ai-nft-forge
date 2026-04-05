# V1 Scope

## Goal

Land Phase 1 foundation so the repository can support later upload, generation, curation, publication, and minting work without rework.

## In Scope Now

- Durable repo memory and planning docs
- Initial architecture boundaries
- Phase planning
- Durable route and job planning
- Durable status model planning
- Web shell, worker shell, database backbone, auth foundation, and local Docker-backed infrastructure

## Phase 1 Expected To Land

- Web app foundation with Next.js App Router and TypeScript
- Worker foundation with Node.js and TypeScript
- Shared environment and validation conventions
- PostgreSQL, Prisma, Redis, and BullMQ baseline integration points
- Docker-first local development shape
- Local S3-compatible storage direction with MinIO
- Initial operational boundaries for studio, public, and worker surfaces

## Explicitly Not In Scope Yet

- Upload implementation
- Image generation implementation
- Contract implementation
- Minting flows
- Storefront polish implementation
- CI release automation

## Exit Condition For This Slice

The repository should boot as a coherent Phase 1 foundation with local services, shared tooling, auth/session groundwork, and accurate repo memory so Phase 2 can begin on stable infrastructure.
