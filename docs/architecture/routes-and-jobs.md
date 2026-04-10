# Routes And Jobs

This document defines durable boundary expectations for the implemented web, worker, and public release surfaces. The repository now has auth and health endpoints, source asset intake routes, owner-scoped collection draft and publication routes, owner-signed onchain deployment/mint control routes, durable studio settings, protected generated-output retrieval plus moderation routes, public brand and collection launch routes derived from published snapshots, public collection metadata plus contract/token-uri routes, authenticated ops alert and reconciliation controls, generation dispatch, and worker-owned observability/reconciliation job families.

## Current Route Surfaces

- `/`
- `/sign-in`
- `/studio`
- `/studio/assets`
- `/studio/collections`
- `/studio/settings`
- `/ops`
- `/brands/[brandSlug]`
- `/brands/[brandSlug]/collections/[collectionSlug]`
- `/brands/[brandSlug]/collections/[collectionSlug]/contract`
- `/brands/[brandSlug]/collections/[collectionSlug]/metadata`
- `/brands/[brandSlug]/collections/[collectionSlug]/metadata/[editionNumber]`
- `/brands/[brandSlug]/collections/[collectionSlug]/token-uri/[tokenId]`
- `/api/health`
- `/api/auth/nonce`
- `/api/auth/verify`
- `/api/auth/logout`
- `/api/auth/session`
- `/api/ops/alert-escalation`
- `/api/ops/alert-mutes/[code]`
- `/api/ops/alert-routing`
- `/api/ops/alert-schedule`
- `/api/ops/alerts/[alertStateId]/acknowledge`
- `/api/ops/alerts/[alertStateId]/mute`
- `/api/ops/reconciliation/run`
- `/api/ops/reconciliation/issues/[issueId]/repair`
- `/api/ops/reconciliation/issues/[issueId]/ignore`
- `/api/studio/assets`
- `/api/studio/assets/upload-intents`
- `/api/studio/assets/[assetId]/complete`
- `/api/studio/collections`
- `/api/studio/collections/[collectionDraftId]`
- `/api/studio/collections/[collectionDraftId]/items`
- `/api/studio/collections/[collectionDraftId]/items/[itemId]`
- `/api/studio/collections/[collectionDraftId]/items/reorder`
- `/api/studio/collections/[collectionDraftId]/onchain/deployment-intent`
- `/api/studio/collections/[collectionDraftId]/onchain/deployment`
- `/api/studio/collections/[collectionDraftId]/onchain/mint-intent`
- `/api/studio/collections/[collectionDraftId]/onchain/mints`
- `/api/studio/collections/[collectionDraftId]/publish`
- `/api/studio/settings`
- `/api/studio/generations`
- `/api/studio/generations/[generationRequestId]/retry`
- `/api/studio/generated-assets/[generatedAssetId]/download-intent`
- `/api/studio/generated-assets/[generatedAssetId]/moderation`

## Implemented Surface Areas

- Studio web surface for client operations, curation, moderation, collection drafting, and publication
- Public web surface for branded collection pages, storefront launches, metadata, contract artifacts, and recorded onchain release summaries
- Worker surface for asynchronous processing, observability capture, alert delivery, and reconciliation
- Single-node self-host packaging surface through Docker Compose

## Durable Route Groups

- `/studio`
- `/studio/assets`
- `/studio/collections`
- `/studio/settings`
- `/ops`
- `/brands/[brandSlug]`
- `/brands/[brandSlug]/collections/[collectionSlug]`

## Current Job Families

- asset ingestion
- generation dispatch
- generation result normalization
- derivative asset preparation
- collection publication preparation
- observability capture and alert delivery
- reconciliation

## Boundary Rules

- Long-running and retryable work belongs in jobs, not request handlers.
- Public collection delivery should stay distinct from studio operations.
- Public storefront presentation should continue to resolve only from saved brand settings plus immutable published collection snapshots.
- Onchain deployment and mint control routes should remain authenticated, owner-scoped, and intent-based; transaction signing stays outside the server boundary.
- Generated-asset moderation should remain a protected studio-only control-plane action and should not leak mutable moderation state into public storefront read models.
- Reconciliation runs, issue persistence, and repair actions should remain authenticated and owner-scoped, with automated execution owned by the worker rather than the web app.
- Once deployment or mint activity is recorded for a published collection, subsequent publication-boundary mutations should remain blocked to preserve immutable onchain release semantics.
- Internal APIs should support the web app and workers without exposing operational controls publicly.
- Route and job design should preserve the B2B white-label model and future multi-tenant concerns.
