# Environment Reference

This document is the durable source of truth for runtime environment variables across local development and single-node self-host deployment.

## Required everywhere

- `DATABASE_URL`: PostgreSQL connection string used by `web`, `worker`, and migrations
- `REDIS_URL`: Redis connection string used by `web` queue diagnostics and the worker
- `S3_ENDPOINT`
- `S3_FORCE_PATH_STYLE`
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_BUCKET_PRIVATE`
- `S3_BUCKET_PUBLIC`
- `AUTH_MESSAGE_STATEMENT`
- `AUTH_NONCE_TTL_MINUTES`
- `AUTH_SESSION_COOKIE_NAME`
- `AUTH_SESSION_TTL_DAYS`
- `COMMERCE_CHECKOUT_PROVIDER_MODE`
- `COMMERCE_RESERVATION_TTL_SECONDS`

## Web and worker generation path

- `GENERATION_ADAPTER_KIND`
  - `http_backend` is the recommended self-host default
  - `storage_copy` remains useful for deterministic local testing
- `GENERATION_BACKEND_URL`
- `GENERATION_BACKEND_TIMEOUT_MS`
- `GENERATION_BACKEND_AUTH_TOKEN`
- `GENERATED_ASSET_DOWNLOAD_URL_TTL_SECONDS`
- `SOURCE_ASSET_UPLOAD_URL_TTL_SECONDS`

## Web onchain verification

- `ONCHAIN_BASE_SEPOLIA_RPC_URL`
- `ONCHAIN_BASE_RPC_URL`

These are used by the web app to verify deployment and mint receipts against Base Sepolia or Base before it records onchain activity back into a published collection, and by reconciliation to recheck recorded deployments and mints against live chain state. They may point at public RPC endpoints for local work, but self-host deployments should prefer a stable provider URL.

## Web commerce checkout

- `COMMERCE_CHECKOUT_PROVIDER_MODE`
  - `manual` enables the hosted reservation and simulated manual checkout flow
  - `stripe` enables Stripe-hosted checkout plus webhook-driven completion on `/api/commerce/stripe/webhook`
  - `disabled` hides checkout and blocks new reservation creation
- `COMMERCE_STRIPE_PUBLISHABLE_KEY`
- `COMMERCE_STRIPE_SECRET_KEY`
- `COMMERCE_STRIPE_WEBHOOK_SECRET`
- `COMMERCE_RESERVATION_TTL_SECONDS`
  - Stripe mode clamps the effective reservation and hosted-session lifetime to at least 1800 seconds

Recommended self-host baseline:

- `COMMERCE_CHECKOUT_PROVIDER_MODE=manual`
- `COMMERCE_RESERVATION_TTL_SECONDS=900`

Recommended Stripe baseline:

- `COMMERCE_CHECKOUT_PROVIDER_MODE=stripe`
- `COMMERCE_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_...`
- `COMMERCE_STRIPE_SECRET_KEY=sk_live_or_test_...`
- `COMMERCE_STRIPE_WEBHOOK_SECRET=whsec_...`
- `COMMERCE_RESERVATION_TTL_SECONDS=1800`

## Worker concurrency and naming

- `WORKER_SERVICE_NAME`
- `GENERATION_QUEUE_CONCURRENCY`
- `NOOP_QUEUE_CONCURRENCY`
- `LOG_LEVEL`

## Reconciliation automation

- `OPS_RECONCILIATION_SCHEDULE_ENABLED`
- `OPS_RECONCILIATION_RUN_ON_START`
- `OPS_RECONCILIATION_INTERVAL_SECONDS`
- `OPS_RECONCILIATION_JITTER_SECONDS`
- `OPS_RECONCILIATION_LOCK_TTL_SECONDS`

Recommended self-host baseline:

- `OPS_RECONCILIATION_SCHEDULE_ENABLED=true`
- `OPS_RECONCILIATION_RUN_ON_START=true`
- `OPS_RECONCILIATION_INTERVAL_SECONDS=300`

## Observability capture automation

- `OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED`
- `OPS_OBSERVABILITY_CAPTURE_RUN_ON_START`
- `OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS`
- `OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS`
- `OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS`

Recommended self-host baseline:

- `OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED=true`
- `OPS_OBSERVABILITY_CAPTURE_RUN_ON_START=true`
- `OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS=300`

## Ops webhook delivery

- `OPS_ALERT_WEBHOOK_ENABLED`
- `OPS_ALERT_WEBHOOK_URL`
- `OPS_ALERT_WEBHOOK_BEARER_TOKEN`
- `OPS_ALERT_WEBHOOK_TIMEOUT_MS`

All are optional. Leave webhook delivery disabled if you do not have an external alert receiver.

## Generation backend service

- `GENERATION_BACKEND_BIND_HOST`
- `GENERATION_BACKEND_PORT`
- `GENERATION_BACKEND_SERVICE_NAME`
- `GENERATION_BACKEND_PROVIDER_KIND`
- `GENERATION_BACKEND_READINESS_TIMEOUT_MS`

## ComfyUI provider options

Only needed when `GENERATION_BACKEND_PROVIDER_KIND=comfyui`.

- `COMFYUI_BASE_URL`
- `COMFYUI_API_BEARER_TOKEN`
- `COMFYUI_CHECKPOINT_NAME`
- `COMFYUI_POSITIVE_PROMPT`
- `COMFYUI_NEGATIVE_PROMPT`
- `COMFYUI_STEPS`
- `COMFYUI_CFG_SCALE`
- `COMFYUI_DENOISE`
- `COMFYUI_SAMPLER_NAME`
- `COMFYUI_SCHEDULER`
- `COMFYUI_TIMEOUT_MS`
- `COMFYUI_POLL_INTERVAL_MS`
- `COMFYUI_WORKFLOW_PATH`

## Compose helper values

These are used by `infra/docker/docker-compose.selfhost.yml` and are optional unless you want to change host port bindings.

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`
- `REDIS_PORT`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- `MINIO_API_PORT`
- `MINIO_CONSOLE_PORT`
- `MINIO_BUCKET_PRIVATE`
- `MINIO_BUCKET_PUBLIC`
- `WEB_PORT`
- `GENERATION_BACKEND_PORT_PUBLIC`

## Local vs self-host guidance

- Local development can leave both automation schedulers disabled if you prefer manual actions.
- Self-host deployment should enable both automation schedulers.
- Local development can keep `COMFYUI_BASE_URL` pointed at `127.0.0.1`; containerized self-host should usually use `host.docker.internal` or an internal network host that your backend can reach.
- Keep `S3_ENDPOINT` pointed at the MinIO service inside Docker Compose for self-host, not the host-mapped port.
- For dependable onchain verification, point `ONCHAIN_BASE_SEPOLIA_RPC_URL` and `ONCHAIN_BASE_RPC_URL` at stable RPC providers rather than rate-limited public endpoints.
- `manual` commerce mode remains the simplest self-host validation path.
- `stripe` mode requires live publication pricing (`priceAmountMinor` plus `priceCurrency`) before checkout can open for a collection.
