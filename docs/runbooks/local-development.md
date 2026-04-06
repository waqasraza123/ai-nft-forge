# Local Development

## Prerequisites

- Node.js `22.17.0` or newer
- pnpm `10.11.1` or newer
- Docker with Compose

## Boot Sequence

1. `cp .env.example .env`
2. `pnpm install`
3. `pnpm infra:up`
4. `pnpm db:migrate:deploy`
5. Set `GENERATION_ADAPTER_KIND=http_backend` if you want the worker to route requests through the standalone generation backend service.
6. Leave `GENERATION_BACKEND_PROVIDER_KIND=deterministic_transform` for a no-GPU local backend, or switch it to `comfyui` and set `COMFYUI_BASE_URL` plus `COMFYUI_CHECKPOINT_NAME` when a ComfyUI server is available.
7. If you use `COMFYUI_WORKFLOW_PATH`, point it at a JSON API workflow template that still contains the required `__COMFY_*__` placeholders used by the backend.
8. Start ComfyUI separately before the generation backend when `GENERATION_BACKEND_PROVIDER_KIND=comfyui`.
9. `pnpm --filter @ai-nft-forge/web dev`
10. `pnpm --filter @ai-nft-forge/generation-backend build`
11. `pnpm --filter @ai-nft-forge/generation-backend start`
12. `pnpm --filter @ai-nft-forge/worker build`
13. `pnpm --filter @ai-nft-forge/worker start`

## Local Services

- PostgreSQL: `127.0.0.1:55432`
- Redis: `127.0.0.1:56379`
- MinIO API: `127.0.0.1:59000`
- MinIO Console: `127.0.0.1:59001`

## Verification

- `pnpm infra:ps`
- `pnpm validate`
- `DATABASE_URL='postgresql://ai_nft_forge:ai_nft_forge@127.0.0.1:55432/ai_nft_forge?schema=public' pnpm db:migrate:status`
- `curl http://127.0.0.1:3000/api/health`
- `pnpm worker:health`
- `pnpm generation-backend:health`

## Shutdown

- `pnpm infra:down`
