# Service Overview

## Runtime Services

- Web app: `apps/web` serves marketing, studio, public placeholder, live ops diagnostics, persisted ops history and multi-channel alert-delivery read models, active-alert acknowledgment and mute controls, owner-scoped webhook-routing, delivery-schedule, and escalation controls, capture-automation status, authenticated ops queue/activity controls, rolling owner-scoped ops metrics, synthesized operator alerts, health, auth, the interactive studio asset workflow, source asset list and intake routes, generation dispatch, failed-generation retry, and protected generated-output download-intent routes.
- Worker: `apps/worker` owns asynchronous job execution and queue consumers, including generation request processing, generated output materialization, optional external HTTP backend delegation, and both the one-shot and interval-scheduled persisted ops observability capture path used for history and multi-channel alert delivery, routing, schedule filtering, and repeated webhook reminders for unchanged active unacknowledged alerts.
- Generation backend: `apps/generation-backend` serves `POST /generate`, `GET /health`, and `GET /ready`, authenticates worker requests when configured, reads source objects, selects either a deterministic or ComfyUI provider, and writes completed output variants into private object storage.
- PostgreSQL: system of record for auth, workspaces, brands, source assets, generation requests, generated assets, persisted ops observability captures, alert state, alert delivery records, and audit data.
- Redis: queue backend for BullMQ.
- MinIO: local S3-compatible object storage boundary for source assets and generated outputs.

## Phase 1 Deployment Shape

- Docker Compose under `infra/docker` runs PostgreSQL, Redis, MinIO, and MinIO bucket bootstrap locally.
- The web app and worker run from workspace scripts in Phase 1 instead of application containers.
- Local storage boot creates one private bucket and one public bucket.
- Compose uses dedicated host ports so local PostgreSQL or Redis installations do not shadow the Phase 1 stack.

## Health Boundaries

- Web health route: `GET /api/health`
- Worker health command: `pnpm worker:health`
- Worker ops observability capture command: `pnpm --filter @ai-nft-forge/worker ops:capture`
- Worker ops observability capture scheduler: `OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED=true` on `apps/worker`
- Worker outbound alert webhook: `OPS_ALERT_WEBHOOK_ENABLED=true` with `OPS_ALERT_WEBHOOK_URL`
- Generation backend health command: `pnpm generation-backend:health`
- Generation backend readiness command: `pnpm generation-backend:ready`
- Database validation: `pnpm prisma:validate`
- Compose validation: `pnpm infra:config`
