# Routes And Jobs

This document defines durable boundary expectations for the first implementation slices. The repository now has the initial web routes, auth and health endpoints, source asset intake routes, a browser-readable source asset list route with per-asset generation history, owner-scoped collection draft routes for curated generated-asset assembly, publish/unpublish/merchandising controls for public collection snapshots, durable studio settings routes for owner-scoped workspace identity, brand identity, and saved public storefront theme data, public brand and collection launch routes derived from published snapshots, public collection metadata plus contract/token-uri routes derived from published snapshots, the generation dispatch route, the first protected generated-output retrieval route, and the first generation worker output-handling job family.

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
- `/api/studio/assets`
- `/api/studio/assets/upload-intents`
- `/api/studio/assets/[assetId]/complete`
- `/api/studio/collections`
- `/api/studio/collections/[collectionDraftId]`
- `/api/studio/collections/[collectionDraftId]/items`
- `/api/studio/collections/[collectionDraftId]/items/[itemId]`
- `/api/studio/collections/[collectionDraftId]/items/reorder`
- `/api/studio/collections/[collectionDraftId]/publish`
- `/api/studio/settings`
- `/api/studio/generations`
- `/api/studio/generations/[generationRequestId]/retry`
- `/api/studio/generated-assets/[generatedAssetId]/download-intent`

## Planned Surface Areas

- Studio web surface for client operations, curation, and collection drafting
- Public web surface for branded collection pages
- Worker surface for asynchronous processing and reconciliation

## Planned Route Groups

- `/studio`
- `/studio/assets`
- `/studio/collections`
- `/collections/[slug]`
- `/api/internal/*`

## Planned Job Families

- asset ingestion
- generation dispatch
- generation result normalization
- derivative asset preparation
- collection publication preparation
- contract publication later
- reconciliation later

## Boundary Rules

- Long-running and retryable work belongs in jobs, not request handlers.
- Public collection delivery should stay distinct from studio operations.
- Public storefront presentation should continue to resolve only from saved brand settings plus immutable published collection snapshots.
- Internal APIs should support the web app and workers without exposing operational controls publicly.
- Route and job design should preserve the B2B white-label model and future multi-tenant concerns.
