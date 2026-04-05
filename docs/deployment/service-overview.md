# Service Overview

## Runtime Services

- Web app: `apps/web` serves marketing, studio, public placeholder, ops placeholder, health, and auth routes.
- Worker: `apps/worker` owns asynchronous job execution and queue consumers.
- PostgreSQL: system of record for auth, workspaces, brands, and audit data.
- Redis: queue backend for BullMQ.
- MinIO: local S3-compatible object storage boundary for later asset workflows.

## Phase 1 Deployment Shape

- Docker Compose under `infra/docker` runs PostgreSQL, Redis, MinIO, and MinIO bucket bootstrap locally.
- The web app and worker run from workspace scripts in Phase 1 instead of application containers.
- Local storage boot creates one private bucket and one public bucket.
- Compose uses dedicated host ports so local PostgreSQL or Redis installations do not shadow the Phase 1 stack.

## Health Boundaries

- Web health route: `GET /api/health`
- Worker health command: `pnpm worker:health`
- Database validation: `pnpm prisma:validate`
- Compose validation: `pnpm infra:config`
