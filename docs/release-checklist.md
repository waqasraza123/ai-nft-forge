# Release Checklist

Use this checklist before tagging any public release.

## Code and contracts

- `pnpm format-check`
- `pnpm prisma:validate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Runtime validation

- `pnpm worker:health`
- `pnpm generation-backend:health`
- `pnpm generation-backend:ready`
- `pnpm infra:selfhost:config`

## Browser and operator validation

- `pnpm --filter @ai-nft-forge/web exec playwright install --with-deps chromium`
- `pnpm test:smoke`
- confirm `/ops` shows capture automation and reconciliation automation
- confirm a manual reconciliation run works

## Container validation

- `docker build -f apps/web/Dockerfile .`
- `docker build -f apps/worker/Dockerfile .`
- `docker build -f apps/generation-backend/Dockerfile .`
- `pnpm infra:selfhost:config`

## Documentation

- README reflects the current shipped surface
- `.env.example` and `docs/deployment/environment-reference.md` match the code
- self-host guide matches the compose file
- operator and troubleshooting runbooks match the current `/ops` and moderation surfaces

## Release metadata

- `LICENSE` is present
- `CONTRIBUTING.md`, `SECURITY.md`, and `SUPPORT.md` match the public repo posture
- `docs/project-state.md` and `docs/architecture/phases.md` reflect the actual release state
