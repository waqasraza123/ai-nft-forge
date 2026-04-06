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
5. `pnpm --filter @ai-nft-forge/web dev`
6. `pnpm --filter @ai-nft-forge/worker build`
7. `pnpm --filter @ai-nft-forge/worker start`

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

## Shutdown

- `pnpm infra:down`
