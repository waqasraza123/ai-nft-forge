# Self-Host With Docker Compose

This repository supports a single-node self-host deployment path through `infra/docker/docker-compose.selfhost.yml`.

## What the stack includes

- PostgreSQL
- Redis
- MinIO
- bucket bootstrap for private and public storage
- migration job
- generation-backend
- worker
- web

## Prerequisites

- Docker Engine with Compose v2
- Enough disk for PostgreSQL, Redis append-only persistence, MinIO objects, and app images
- A prepared `.env` file based on `.env.example`

## First boot

1. Copy `.env.example` to `.env`.
2. Set real credentials for PostgreSQL, MinIO, and session/auth values.
3. Choose a generation backend mode.
4. Enable observability and reconciliation automation for self-host.
5. Start the stack.

```bash
cp .env.example .env
pnpm install
pnpm infra:selfhost:up
pnpm infra:selfhost:ps
```

The migration container runs `pnpm db:migrate:deploy` before the app services start.

## Recommended settings

- `GENERATION_ADAPTER_KIND=http_backend`
- `OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED=true`
- `OPS_RECONCILIATION_SCHEDULE_ENABLED=true`
- `OPS_ALERT_WEBHOOK_ENABLED=false` unless you have a receiver ready

## Service endpoints

- Web: `http://127.0.0.1:${WEB_PORT:-3000}`
- Generation backend health: `http://127.0.0.1:${GENERATION_BACKEND_PORT_PUBLIC:-8787}/health`
- MinIO API: `http://127.0.0.1:${MINIO_API_PORT:-59000}`
- MinIO console: `http://127.0.0.1:${MINIO_CONSOLE_PORT:-59001}`

## Upgrades

1. Pull the new repo revision.
2. Review `docs/project-state.md`, `docs/architecture/phases.md`, and migration notes in the changelog or release checklist.
3. Rebuild and restart the stack.

```bash
git pull
pnpm install
pnpm infra:selfhost:up
```

The migration job will apply any new Prisma migrations before the app services proceed.

## Backups

- PostgreSQL: back up the `postgres-data` volume or run logical dumps with `pg_dump`
- MinIO: back up the `minio-data` volume or replicate the private and public buckets externally
- Redis: Redis is operationally useful but not the system of record; preserve the `redis-data` volume for queue recovery and alert timing continuity

## Shutdown

```bash
pnpm infra:selfhost:down
```

## Compose validation

```bash
pnpm infra:selfhost:config
```
