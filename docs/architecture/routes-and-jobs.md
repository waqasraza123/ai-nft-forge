# Routes And Jobs

This document defines durable boundary expectations for the implemented web, worker, and public release surfaces. The repository now has auth and health endpoints, source asset intake routes, workspace-scoped collection draft routes, owner-scoped publication routes, owner-signed onchain deployment/mint control routes, durable studio settings, protected generated-output retrieval plus moderation routes, public brand and collection launch routes derived from published snapshots, public collection metadata plus contract/token-uri routes, authenticated ops alert and reconciliation controls, generation dispatch, and worker-owned observability/reconciliation job families including onchain drift verification.

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
- `/api/studio/settings/access-review`
- `/api/studio/settings/access-review/attestations`
- `/api/studio/settings/members/[membershipId]`
- `/api/studio/settings/invitations/[invitationId]`
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
- Onchain deployment and mint control routes should remain authenticated, owner-scoped, wallet-driven, and intent-based; transaction signing stays outside the server boundary and the server should only persist results after verifying the submitted hash onchain.
- Generated-asset moderation should remain a protected studio-only control-plane action and should not leak mutable moderation state into public storefront read models.
- Reconciliation runs, issue persistence, and repair actions should remain authenticated and workspace-scoped, with owner/operator mutation access, viewer read-only access, automated execution owned by the worker rather than the web app, and recorded onchain deployments/mints re-verified there against live chain state.
- Once deployment or mint activity is recorded for a published collection, subsequent publication-boundary mutations should remain blocked to preserve immutable onchain release semantics.
- Additional minting should remain blocked whenever open onchain reconciliation issues exist for that published collection.
- Workspace viewers may read selected-workspace studio and ops surfaces, but every active mutation helper and fleet mutation route must reject viewer access before calling service-layer mutation code.
- Workspace access review export is owner-only, selected-workspace scoped, and available as JSON or CSV from `GET /api/studio/settings/access-review`; the report includes the current deterministic evidence hash, whether it still matches the latest recorded attestation, and summary deltas when prior evidence exists. `POST /api/studio/settings/access-review` records an audit-backed evidence hash for the current review snapshot, and `GET /api/studio/settings/access-review/attestations` lists prior review attestations as JSON or CSV.
- Workspace audit review is authenticated and selected-workspace scoped at `GET /api/ops/audit`; category filters cover `workspace_access`, `ownership_transfer`, `workspace_lifecycle`, and `workspace_policy`, and CSV export uses the same server-side action mapping. Lifecycle rows include archive/suspend/reactivate, invitation reminders, and retained decommission schedule/notice/execute activity, while policy rows include retention, lifecycle delivery, lifecycle automation, and lifecycle SLA updates. JSON and CSV audit rows expose structured lifecycle/policy metadata such as automation source, notification kind, retention days, execute-after/export-confirmed timestamps, access-review gate status/hash, retention policy values, lifecycle automation toggles, delivery toggles, and lifecycle SLA thresholds so operators can audit the exact operational state behind each event without reading raw audit metadata. Metadata parsing is defensive: malformed legacy timestamps, hashes, integers, booleans, or strings are emitted as blank/null fields instead of failing the entire audit response or export.
- Workspace export is owner-only at `GET /api/studio/workspaces/[workspaceId]/export`; JSON and CSV export modes include the same access-review freshness state and summary deltas so offboarding packages show whether governance evidence is current before archive/decommission decisions. Settings access-review exports, workspace export/offboarding verification, and retention/offboarding overview entries use the same server evidence builder to keep rows, summary counts, hashes, freshness, and deltas consistent. A missing or changed access-review attestation is an offboarding caution, so decommission scheduling, retained decommission notice recording, and final decommission execution remain review-gated until the owner records the current access state. Access-review hashes cover access-governance evidence only; operational lifecycle/decommission audit rows remain visible in ops/offboarding audit exports without invalidating an otherwise-current access attestation, and decommission audit metadata preserves the access-review hash/status that justified each retained lifecycle step.
- Internal APIs should support the web app and workers without exposing operational controls publicly.
- Route and job design should preserve the B2B white-label model and future multi-tenant concerns.
