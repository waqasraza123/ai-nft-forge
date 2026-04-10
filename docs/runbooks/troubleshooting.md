# Troubleshooting

## `docker compose` config fails

- run `pnpm infra:selfhost:config`
- confirm `.env` exists and does not contain malformed URLs
- verify no required variable is wrapped in unmatched quotes

## Web starts but `/ops` shows backend unreachable

- confirm `generation-backend` is healthy
- confirm `GENERATION_BACKEND_URL` points at `http://generation-backend:8787/generate` in self-host compose
- check the backend container logs

## Worker is healthy but generations do not move

- confirm Redis is healthy
- check `/ops` queue diagnostics
- inspect worker logs for generation adapter or storage errors
- verify `GENERATION_ADAPTER_KIND` matches your intended backend mode

## Generation backend readiness never reaches `ready`

- validate the selected provider config
- if using ComfyUI, verify `COMFYUI_BASE_URL`, auth token, workflow path, and checkpoint name
- run `pnpm generation-backend:ready` locally against the same env

## Published storefront images are missing

- run reconciliation from `/ops`
- repair any `published_public_asset_missing` issues
- if repair fails, check the corresponding generated asset in private storage

## Review-ready draft suddenly becomes invalid

- inspect the curated items in `/studio/collections`
- check whether one of the curated generated assets was later rejected or reset from moderation
- use the reconciliation repair path or manually downgrade the draft to `draft`

## Browser smoke failures

- install Chromium with `pnpm --filter @ai-nft-forge/web exec playwright install --with-deps chromium`
- confirm PostgreSQL, Redis, and MinIO are up
- confirm the browser smoke env script resolved valid URLs and storage settings

## Missing objects in private storage

- expect reconciliation to surface `source_asset_object_missing` or `generated_asset_object_missing`
- these are not auto-repairable
- investigate bucket drift, accidental deletion, or incomplete backup restore
