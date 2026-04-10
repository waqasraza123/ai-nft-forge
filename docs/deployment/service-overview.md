# Service Overview

## Runtime Services

- Web app: `apps/web` serves marketing, studio, public storefront routes, contract/token-URI publication routes, live ops diagnostics, persisted ops history, reconciliation controls, moderation-aware collection surfaces, owner-scoped alert policy controls, health, auth, source asset intake, generation dispatch, failed-generation retry, and protected generated-output download-intent routes.
- Worker: `apps/worker` owns asynchronous job execution and queue consumers, including generation request processing, generated output materialization, optional external HTTP backend delegation, persisted observability capture, and interval-scheduled reconciliation with Redis lease coordination.
- Generation backend: `apps/generation-backend` serves `POST /generate`, `GET /health`, and `GET /ready`, authenticates worker requests when configured, reads source objects, selects either a deterministic or ComfyUI provider, and writes completed output variants into private object storage.
- PostgreSQL: system of record for auth, workspaces, brands, source assets, generation requests, generated assets, collection drafts, published collections, persisted ops observability captures, alert state, reconciliation runs/issues, and audit data.
- Redis: queue backend for BullMQ.
- MinIO: S3-compatible object storage boundary for source assets, generated outputs, and public published storefront assets.

## Deployment Shapes

- `infra/docker/docker-compose.yml` remains the lightweight local backing-services stack.
- `infra/docker/docker-compose.selfhost.yml` is the public single-node self-host stack with PostgreSQL, Redis, MinIO, migration job, web, worker, generation-backend, and bucket bootstrap.
- Local and self-host storage boot create one private bucket and one public bucket.
- Self-host guidance is documented in `docs/deployment/self-host-docker-compose.md`.

## Health Boundaries

- Web health route: `GET /api/health`
- Worker health command: `pnpm worker:health`
- Worker ops observability capture command: `pnpm --filter @ai-nft-forge/worker ops:capture`
- Worker ops observability capture scheduler: `OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED=true` on `apps/worker`
- Worker reconciliation command: `pnpm --filter @ai-nft-forge/worker reconcile`
- Worker reconciliation scheduler: `OPS_RECONCILIATION_SCHEDULE_ENABLED=true` on `apps/worker`
- Worker outbound alert webhook: `OPS_ALERT_WEBHOOK_ENABLED=true` with `OPS_ALERT_WEBHOOK_URL`
- Generation backend health command: `pnpm generation-backend:health`
- Generation backend readiness command: `pnpm generation-backend:ready`
- Database validation: `pnpm prisma:validate`
- Compose validation: `pnpm infra:config`
- Self-host compose validation: `pnpm infra:selfhost:config`
