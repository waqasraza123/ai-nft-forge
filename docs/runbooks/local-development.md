# Local Development

## Prerequisites

- Node.js `22.17.0` or newer
- pnpm `10.11.1` or newer
- Docker with Compose

## Boot Sequence

1. `cp .env.example .env`
2. `pnpm install`
3. Leave `DATABASE_MODE=local` for the current Docker-first PostgreSQL flow, or switch to `DATABASE_MODE=neon` plus `DATABASE_NEON_URL` when you want Neon Postgres.
4. `pnpm infra:up`
5. `pnpm db:migrate:deploy`
6. Set `GENERATION_ADAPTER_KIND=http_backend` if you want the worker to route requests through the standalone generation backend service.
7. Leave `GENERATION_BACKEND_PROVIDER_KIND=deterministic_transform` for a no-GPU local backend, or switch it to `comfyui` and set `COMFYUI_BASE_URL` plus `COMFYUI_CHECKPOINT_NAME` when a ComfyUI server is available.
8. Leave `GENERATION_BACKEND_READINESS_TIMEOUT_MS=5000` unless the ComfyUI instance sits behind unusually slow networking.
9. If you use `COMFYUI_WORKFLOW_PATH`, point it at a JSON API workflow template that still contains the required `__COMFY_*__` placeholders used by the backend.
10. Start ComfyUI separately before the generation backend when `GENERATION_BACKEND_PROVIDER_KIND=comfyui`.
11. `pnpm --filter @ai-nft-forge/web dev`
12. `pnpm --filter @ai-nft-forge/generation-backend build`
13. `pnpm --filter @ai-nft-forge/generation-backend start`
14. `pnpm --filter @ai-nft-forge/worker build`
15. `pnpm --filter @ai-nft-forge/worker start`
16. Leave `OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED=false` when you want fully manual capture runs, or enable it to let the worker persist `/ops` history on an interval with Redis lease coordination.
17. Leave `OPS_RECONCILIATION_SCHEDULE_ENABLED=false` when you want manual reconciliation only, or enable it to let the worker keep `/ops` reconciliation state fresh on an interval.
18. Run `pnpm --filter @ai-nft-forge/worker ops:capture` manually when you want an immediate persisted `/ops` capture outside the automated cadence.
19. Run `pnpm --filter @ai-nft-forge/worker reconcile` manually when you want an immediate reconciliation pass outside the automated cadence.
20. Set `OPS_ALERT_WEBHOOK_ENABLED=true` plus `OPS_ALERT_WEBHOOK_URL` when you want the worker to POST operator alerts to an external webhook in addition to the built-in audit-log delivery record.

Neon-specific notes:

- `pnpm infra:up` still starts Redis and MinIO, but omits Docker Postgres when `DATABASE_MODE=neon`.
- Set `DATABASE_NEON_DIRECT_URL` for Prisma and `DATABASE_NEON_SHADOW_URL` only when you need `pnpm --filter @ai-nft-forge/database prisma:migrate:dev`.

## Local Services

- PostgreSQL: `127.0.0.1:55432` when `DATABASE_MODE=local`
- Redis: `127.0.0.1:56379`
- MinIO API: `127.0.0.1:59000`
- MinIO Console: `127.0.0.1:59001`

## Verification

- `pnpm infra:ps`
- `pnpm validate`
- `pnpm --filter @ai-nft-forge/web exec playwright install chromium`
- `pnpm test:smoke`
- `pnpm --filter @ai-nft-forge/worker ops:capture`
- `pnpm --filter @ai-nft-forge/worker reconcile`
- `DATABASE_MODE=local DATABASE_URL='postgresql://ai_nft_forge:ai_nft_forge@127.0.0.1:55432/ai_nft_forge?schema=public' pnpm db:migrate:status`
- `DATABASE_MODE=neon DATABASE_NEON_URL='postgresql://...' DATABASE_NEON_DIRECT_URL='postgresql://...' pnpm db:migrate:status`
- `curl http://127.0.0.1:3000/api/health`
- `pnpm worker:health`
- `pnpm generation-backend:health`
- `pnpm generation-backend:ready`
- `curl http://127.0.0.1:8787/ready`

## Shutdown

- `pnpm infra:down`
