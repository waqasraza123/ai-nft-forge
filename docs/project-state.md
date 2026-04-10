# Project State

## Product

AI NFT Forge is a self-hosted, white-label product for turning client photos into collectible-style art variants, curating final assets, publishing branded collection pages, operating authenticated moderation and ops workflows, packaging the system for external self-host adopters, and now authenticating and executing owner-signed onchain deployment and mint activity from immutable published snapshots through Base Account-capable wallet UX plus chain-state verification, plus published-item reservations, hosted checkout, and owner-scoped commerce administration for live drops. The repository now contains the completed current Phase 1 through Phase 7 scope plus post-phase wallet, onchain, and commerce slices: storage-backed source asset intake, queue-backed generation orchestration, durable generated-output persistence, the standalone generation backend, provider-aware ops diagnostics, persisted observability capture plus alert delivery policy, owner-scoped collection drafting and publication, preset-driven white-label storefront presentation, published-snapshot-backed metadata and contract/token-uri routes, owner-scoped generated-asset moderation, worker-owned reconciliation with persisted runs and repairable issues, Apache-2.0 self-host packaging with Dockerfiles, a single-node Compose stack, release-grade docs, Base Account and injected-wallet session authentication, shared wallet-driven contract deployment and mint flows with server-verified onchain deployment and mint ledgers, chain-state reconciliation for recorded contract deployments and mints, and item-level public reservation plus hosted manual or Stripe-backed checkout for live published collections with studio-side fulfillment and recovery controls.

## Current Architecture

The repository now has a pnpm workspace monorepo with Turbo, TypeScript, ESLint, Prettier, GitHub Actions CI, and the expected Phase 1 layout:

- `apps/web`
- `apps/worker`
- `apps/generation-backend`
- `packages/shared`
- `packages/database`
- `packages/ui`
- `packages/config`
- `packages/contracts`
- `infra/docker`

Current implementation status:

- `apps/web` is a real Next.js App Router app with route groups for marketing, studio, public brand collection placeholders, and ops.
- `apps/web` exposes `GET /api/health`.
- `apps/web` now exposes `POST /api/auth/nonce`, `POST /api/auth/verify`, `POST /api/auth/logout`, and `GET /api/auth/session`, plus a real `/sign-in` wallet UX built on Wagmi with Base Account SIWE and injected-wallet fallback against the same server-issued nonce/session boundary.
- `apps/web` now protects `/studio` with server-side session lookup and redirects unauthenticated requests to `/sign-in`.
- `apps/web` now exposes an interactive `/studio/assets` browser workflow plus `GET /api/studio/assets`, `POST /api/studio/assets/upload-intents`, `POST /api/studio/assets/[assetId]/complete`, `POST /api/studio/generations`, `POST /api/studio/generations/[generationRequestId]/retry`, `POST /api/studio/generated-assets/[generatedAssetId]/download-intent`, and `PATCH /api/studio/generated-assets/[generatedAssetId]/moderation` for source asset intake, generation dispatch, retry, polling, protected generated-output retrieval, owner-scoped moderation updates, and per-asset generation history inspection.
- `apps/web` now also exposes `/studio/collections` plus `GET/POST /api/studio/collections`, `PATCH /api/studio/collections/[collectionDraftId]`, `POST /api/studio/collections/[collectionDraftId]/items`, `DELETE /api/studio/collections/[collectionDraftId]/items/[itemId]`, and `POST /api/studio/collections/[collectionDraftId]/items/reorder` for owner-scoped collection draft creation, metadata management, curated generated-asset inclusion, and ordered draft assembly.
- `apps/web` now also exposes `POST/DELETE/PATCH /api/studio/collections/[collectionDraftId]/publish`, `GET/PUT /api/studio/settings`, owner-signed onchain control routes at `POST /api/studio/collections/[collectionDraftId]/onchain/deployment-intent`, `POST /api/studio/collections/[collectionDraftId]/onchain/deployment`, `POST /api/studio/collections/[collectionDraftId]/onchain/mint-intent`, and `POST /api/studio/collections/[collectionDraftId]/onchain/mints`, a wallet-driven `/studio/collections` deployment and mint UI that prepares intents, opens the browser wallet, waits for receipts, retries pending confirmations, only records verified chain state, and now blocks additional minting while open onchain reconciliation issues exist for that publication, a protected `/studio/settings` surface for durable workspace identity, brand identity, and public storefront theme management, a protected `/studio/commerce` surface plus `GET /api/studio/commerce`, `POST /api/studio/commerce/checkouts/[checkoutSessionId]/complete`, `POST /api/studio/commerce/checkouts/[checkoutSessionId]/cancel`, and `PATCH /api/studio/commerce/checkouts/[checkoutSessionId]/fulfillment` for owner-scoped reservation recovery, manual payment confirmation, and fulfillment-state tracking, a branded public `/brands/[brandSlug]` landing route with grouped featured/live/upcoming/archive sections, a live `/brands/[brandSlug]/collections/[collectionSlug]` launch page that resolves published collection snapshots, hero media, launch status, CTA configuration, durable public published-asset URLs, recorded onchain deployment/mint summaries, and new commerce availability, plus public reservation and checkout routes at `POST /api/brands/[brandSlug]/collections/[collectionSlug]/checkout`, `POST /api/brands/[brandSlug]/collections/[collectionSlug]/checkout/[checkoutSessionId]/complete`, and `POST /api/brands/[brandSlug]/collections/[collectionSlug]/checkout/[checkoutSessionId]/cancel`, a Stripe webhook route at `POST /api/commerce/stripe/webhook`, and a hosted `/brands/[brandSlug]/collections/[collectionSlug]/checkout/[checkoutSessionId]` checkout page that can either simulate manual completion or hand off to Stripe-hosted payment depending on the configured provider mode, public metadata JSON at `/brands/[brandSlug]/collections/[collectionSlug]/metadata` plus `/brands/[brandSlug]/collections/[collectionSlug]/metadata/[editionNumber]`, public contract/token-uri JSON at `/brands/[brandSlug]/collections/[collectionSlug]/contract` plus `/brands/[brandSlug]/collections/[collectionSlug]/token-uri/[tokenId]`, and authenticated reconciliation control routes at `POST /api/ops/reconciliation/run`, `POST /api/ops/reconciliation/issues/[issueId]/repair`, and `POST /api/ops/reconciliation/issues/[issueId]/ignore`.
- `apps/worker` is now a real Node.js worker shell with env parsing, PostgreSQL, Redis, and object-storage connection setup, BullMQ queue registration, generation request processing, selectable generation adapters (`storage_copy` or `http_backend`), a noop processor, graceful shutdown hooks, `health`, `ops:capture`, and `reconcile` commands, plus Redis-leased schedulers for both observability capture and reconciliation, including onchain deployment/mint drift checks against Base Sepolia/Base.
- `apps/generation-backend` is now a real Node.js service that implements the worker HTTP generation contract, validates bearer auth when configured, reads source objects from private storage, writes generated outputs back to private storage, exposes `GET /health` plus provider-aware `GET /ready`, cleans up partial outputs on failure, and supports either a deterministic transform provider or a ComfyUI-backed model provider behind the same contract.
- `packages/ui` provides reusable page-shell and surface primitives used by the web app.
- `packages/shared` now centralizes worker env validation, auth request/response schemas, storage env parsing, reusable object-storage helpers, source asset upload contracts, generation request contracts, generation-backend health/readiness contracts, generated asset contracts including moderation state, collection draft, publication, public metadata contracts, commerce reservation, checkout, dashboard, and fulfillment contracts including explicit publication pricing fields and Stripe-related env parsing, onchain deployment/mint request and summary contracts, reconciliation issue/run contracts including onchain drift issue kinds, studio settings contracts, and queue payload definitions.
- `packages/contracts` now provides deterministic collection-contract helper utilities for Base Sepolia/Base publication metadata, route/url derivation, contract naming, token-uri path construction, supported chain metadata, and a server-only ERC-721 compilation entrypoint used to prepare owner-signed deployment and mint call data.
- `packages/database` now contains the Prisma schema, initial SQL migration, repository helpers, transaction helper, PostgreSQL client boundary, and the `SourceAsset`, `GenerationRequest`, `GeneratedAsset` with owner-scoped moderation state, `CollectionDraft`, `CollectionDraftItem`, `PublishedCollection`, `PublishedCollectionItem` with public-asset references, recorded contract deployment fields, `PublishedCollectionMint`, `PublishedCollectionReservation`, `CommerceCheckoutSession`, `Workspace`, and `Brand` models and repositories used by the current app surface.
- `infra/docker/docker-compose.yml` now provides local PostgreSQL, Redis, MinIO, and MinIO bucket bootstrap services, while `infra/docker/docker-compose.selfhost.yml` packages PostgreSQL, Redis, MinIO, bucket bootstrap, migrations, web, worker, and generation-backend into a single-node self-host stack.
- The root repo now also ships versioned Git hooks under `.githooks` plus `pnpm setup:githooks`, `pnpm verify:push`, and `pnpm safe-push` so normal `git push` is blocked when `pnpm build` fails after hook setup is applied in a clone.
- `.env.example` now documents the current local and self-host runtime environment shape, including reconciliation automation, Base/Base Sepolia RPC endpoints for onchain verification and reconciliation, compose-facing service ports, and generation-backend readiness timeout tuning.
- The root repo now also ships an Apache-2.0 `LICENSE`, a public `README.md`, service Dockerfiles for `apps/web`, `apps/worker`, and `apps/generation-backend`, and external-adopter docs covering environment reference, self-host deployment, operator runbooks, troubleshooting, and release readiness.
- `docs/runbooks/local-development.md`, `docs/deployment/service-overview.md`, and the new self-host/operator docs now document boot, verification, deployment, and service boundaries.
- Prisma CLI configuration now lives in `packages/database/prisma.config.ts`, matching Prisma 7 requirements.
- The runtime database client uses the PostgreSQL driver adapter and is created lazily from `DATABASE_URL`.
- The first source asset intake slice uses server-issued signed uploads into the private object-storage bucket plus explicit upload completion verification.
- The generation pipeline now uses persisted `GenerationRequest` and `GeneratedAsset` records, dispatches BullMQ jobs from the web app, and lets the worker either materialize generated outputs internally or validate artifacts produced by an external HTTP backend before transactionally marking requests succeeded.
- Generated outputs now have a protected owner-scoped download-intent contract that issues short-lived signed storage URLs after database ownership and object existence checks.
- The first operator-facing browser client now drives the full upload, generation dispatch, retry, polling, and retrieval workflow from `/studio/assets` while keeping large object transfers on signed storage URLs and long-running work in the worker.
- The studio asset surface now exposes richer latest-generation metadata plus full per-asset generation history, archived-run inspection, and owner-scoped download/retry actions from the history view.
- The studio asset surface now also exposes explicit owner-scoped moderation state for every generated output, with approve/reject/reset controls and moderation-aware summary metrics.
- The studio now also exposes an owner-scoped collection draft surface that lets the authenticated owner create curated draft sets, edit release metadata, order selected generated assets, mark drafts review-ready once they contain curated content, and manage published collection merchandising for featured placement and directory order.
- Collection curation, review-ready transitions, and publication now reject generated assets that are not explicitly approved, while older generated assets are backfilled as approved by migration so existing data remains usable.
- Review-ready collection drafts can now also be published into immutable public collection snapshots, the existing public brand collection route now resolves real published collection data and signed generated-asset image URLs instead of placeholder params only, and the brand root route now resolves a collection directory backed by saved brand identity, saved landing copy, and signed preview assets.
- Published collection snapshots now also drive public metadata manifests, per-edition metadata records, contract manifests, and token-uri records, with collection and studio surfaces linking directly to those JSON routes, while publication-time copied public assets now back collection/media URLs for new publications and older publications still fall back to signed private-storage URLs until republished.
- The ops route now surfaces live web health plus generation-backend liveness/readiness snapshots, and for authenticated operators it also exposes generation queue depth, rolling owner-scoped request windows, synthesized alert diagnostics, owner-scoped recent active/failed generation activity, and owner-scoped retry controls.
- The worker now also supports a one-shot observability capture command that persists owner-scoped ops snapshots, window summaries, alert state, and alert-delivery records into PostgreSQL for later `/ops` inspection.
- The ops route now also renders persisted observability capture history and recent alert-delivery records so operators can inspect more than the current request-derived runtime state.
- The worker can now also run persisted ops observability capture on an interval behind a Redis lease so duplicate worker replicas do not emit the same scheduled capture.
- The ops route now also renders capture-automation health for authenticated operators so they can verify cadence, startup behavior, and last-capture freshness.
- The worker can now also deliver persisted ops alerts to a configured outbound webhook while still recording every audit-log and webhook delivery attempt in PostgreSQL for `/ops` review.
- The ops route now also renders active persisted alert state plus owner-scoped acknowledgment, mute, webhook-routing, webhook-delivery-schedule, and webhook-escalation controls, while the worker clears acknowledgments automatically when the underlying alert resolves or materially changes, suppresses alert delivery while active mutes are in effect, and applies owner-scoped webhook routing, schedule, and escalation policy before external delivery.
- The worker and `/ops` surface now also support owner-scoped reconciliation with persisted runs and issues, Redis-leased scheduled execution, manual run/repair/ignore controls, repair-time public-asset recopies and draft downgrades, freshness/critical-issue warnings for operators, and onchain drift detection for recorded contract deployments and mints.
- `apps/web` now also ships Playwright-based browser smoke coverage for `/studio/assets` and `/ops`, including real auth handshake, seeded owner-scoped fixture data, isolated test schema/Redis usage, and CI execution.
- The studio auth and onchain flow now share a real wallet connection layer with Base Account SIWE sign-in, injected-wallet fallback, owner-wallet connection management on `/studio/collections`, server-side receipt verification, and reconciliation rechecks before additional minting proceeds.
- The public storefront now also exposes item-level reservations and a hosted checkout page for live releases, with provider-mode gating across `manual`, `stripe`, and `disabled`, lazy reservation expiry, publication-level explicit machine pricing for Stripe mode, and sold-count/storefront updates applied only after checkout completion or verified webhook confirmation.

The frozen technical direction remains:

- Next.js App Router with TypeScript for the web app
- Node.js with TypeScript for the worker
- PostgreSQL with Prisma
- Redis with BullMQ
- S3-compatible storage with local MinIO
- Docker-first self-hosted deployment
- Base Sepolia for development and Base Mainnet for production
- OpenZeppelin-based ERC-721 for 1/1 items and ERC-1155 for edition drops later
- ComfyUI behind the standalone generation backend service with deterministic fallback for local and validation-friendly operation

## Non-Negotiable Rules

- No comments in code unless explicitly requested.
- Prefer reusable modules and components over large multi-purpose files.
- Use descriptive and consistent names.
- Write production-grade code with strong typing, validation, and error handling.
- Do not guess missing requirements; state assumptions explicitly.
- Avoid hardcoded values, hacks, and tightly coupled logic.
- Keep repo memory files concise, high-signal, and free of secrets.
- Future Codex sessions must read this file before making implementation decisions.

## Current Roadmap

- Phase 1: foundation
- Phase 2: upload and generation pipeline
- Phase 3: collection draft system
- Phase 4: contracts and publication
- Phase 5: premium storefront and white-label presentation
- Phase 6: hardening, operations, moderation, reconciliation
- Phase 7: open-source packaging and self-host docs

## Completed Major Slices

- Durable repo memory system established with `AGENTS.md`, `docs/project-state.md`, and local session memory conventions.
- Durable planning docs added for product, architecture, routes/jobs, status models, and phased delivery.
- Phase 1 Commit 1 landed the monorepo foundation, root tooling, placeholder workspace packages, local Git initialization, and CI verification workflow.
- Phase 1 Commit 2 landed the Next.js web shell, reusable UI primitives, route-group boundaries, placeholder pages, and the web health endpoint.
- Phase 1 Commit 3 landed the worker shell, shared env and queue definitions, BullMQ registry, noop processor, worker tests, and the worker health command.
- Phase 1 Commit 4 landed the Prisma-backed database package, initial auth and workspace schema, migration baseline, repository helpers, transaction helper, and database health utilities.
- Phase 1 Commit 5 landed the auth nonce/session foundation, auth API routes, shared auth schemas, secure-aware session cookies, tests, and the protected studio shell.
- Phase 1 Commit 6 landed local Docker infrastructure, `.env.example`, setup and deployment docs, root verification commands, CI hardening, and the final Phase 1 handoff updates.
- Phase 1 foundation is now complete and green for the current repo scope.
- Phase 2 Commit 1 landed the `SourceAsset` schema, shared storage and source asset contracts, protected upload-intent and upload-complete routes, storage-backed web service logic, and the first `/studio/assets` surface.
- Phase 2 Commit 2 landed the `GenerationRequest` schema, shared generation and queue contracts, the protected generation dispatch route, studio asset generation status surfacing, and worker-backed lifecycle processing for generation requests.
- Phase 2 Commit 3 landed the `GeneratedAsset` schema, shared generated asset and object-storage contracts, a storage-backed generation adapter, transactional generated output persistence, and studio surfacing for stored generated outputs.
- Phase 2 Commit 4 landed selectable worker generation adapters, the external HTTP backend contract, protected generated-asset download intents, and the first owner-scoped retrieval boundary for stored outputs.
- Phase 2 Commit 5 landed the first interactive studio asset client with multi-file upload, explicit upload verification, per-asset generation dispatch controls, active-job polling, and generated-output download actions.
- Phase 2 Commit 6 landed the standalone generation backend service, shared backend env and storage primitives, real transformed output rendering, backend health reporting, and local runtime wiring for worker-to-backend generation.
- Phase 2 Commit 7 landed the first provider-based model backend inside `apps/generation-backend`, including ComfyUI upload/prompt/history/view orchestration, workflow templating and validation, provider-aware error handling, and deterministic fallback preservation.
- Phase 2 Commit 8 landed provider-aware generation-backend readiness checks, shared health/readiness contracts, readiness CLI support, and a live `/ops` diagnostics surface for web and backend runtime status.
- Phase 2 Commit 9 landed explicit retry support for failed generation requests plus richer studio-visible latest-generation metadata and result surfacing.
- Phase 2 Commit 10 landed authenticated ops queue diagnostics, owner-scoped recent generation activity surfacing, and owner-scoped retry controls on `/ops`.
- Phase 2 Commit 11 landed full per-asset generation history in the studio read model plus archived-run inspection, comparison, download, and retry ergonomics on `/studio/assets`.
- Phase 2 Commit 12 landed rolling owner-scoped ops metrics plus synthesized alert diagnostics on `/ops`, extending the operator surface beyond point-in-time queue depth into recent success-rate, duration, backlog, and stalled-work signals.
- Phase 2 Commit 13 landed browser-level smoke coverage for `/studio/assets` and `/ops`, including isolated Playwright runtime wiring, real session creation, seeded history/activity fixtures, and CI execution.
- Phase 2 Commit 14 landed persisted owner-scoped ops observability captures plus durable alert-delivery history, including new PostgreSQL models, a worker capture command, and `/ops` history panels for multi-day review.
- Phase 2 Commit 15 landed worker-owned ops capture scheduling with Redis lease coordination plus operator-visible automation status on `/ops`, so persisted observability no longer depends on manual command execution alone.
- Phase 2 Commit 16 landed generic outbound webhook delivery for persisted ops alerts, extending the worker-owned alert path beyond audit-log-only records while preserving durable per-channel delivery history on `/ops`.
- Phase 2 Commit 17 landed owner-scoped acknowledgment controls for active persisted alerts on `/ops`, including PostgreSQL-backed acknowledgment state, an authenticated acknowledge API route, and worker-side acknowledgment reset when alert conditions resolve or materially change.
- Phase 2 Commit 18 landed owner-scoped bounded mute policy for persisted ops alerts on `/ops`, including PostgreSQL-backed mute records, authenticated mute and clear-mute API routes, worker-side delivery suppression while mutes are active, and operator-visible mute state on active alerts.
- Phase 2 Commit 19 landed owner-scoped webhook routing preferences for persisted ops alerts on `/ops`, including PostgreSQL-backed routing-policy records, an authenticated alert-routing API route, worker-side filtering for external webhook delivery severity, and operator-visible effective routing policy on `/ops`.
- Phase 2 Commit 20 landed owner-scoped webhook delivery schedules for persisted ops alerts on `/ops`, including PostgreSQL-backed schedule-policy records, an authenticated alert-schedule API route, worker-side time-window suppression for external webhook delivery, and operator-visible effective schedule status on `/ops`.
- Phase 2 Commit 21 landed owner-scoped webhook escalation policy for persisted ops alerts on `/ops`, including PostgreSQL-backed escalation-policy records, an authenticated alert-escalation API route, operator-visible escalation controls on `/ops`, channel-aware alert-delivery timestamps in `OpsAlertState`, and worker-side reminder delivery for unchanged active unacknowledged alerts after the configured delay and repeat interval.
- Phase 3 Commit 1 landed the owner-scoped collection draft foundation on `/studio/collections`, including PostgreSQL-backed `CollectionDraft` and `CollectionDraftItem` models, shared collection contracts, authenticated collection draft APIs, ordered curated generated-asset inclusion and removal, review-ready validation, and the first studio UI for collection draft assembly.
- Phase 3 Commit 2 landed published collection snapshots and live public collection delivery, including PostgreSQL-backed `PublishedCollection` and `PublishedCollectionItem` models, authenticated publish and unpublish controls on `/studio/collections`, route-conflict validation for public collection slugs, and real public rendering on `/brands/[brandSlug]/collections/[collectionSlug]` using signed generated-asset URLs.
- Phase 3 Commit 3 landed durable owner-scoped studio settings and publication defaults, including authenticated `GET/PUT /api/studio/settings`, a protected `/studio/settings` UI, owner-scoped `Workspace` and `Brand` repository expansion, publication-target hydration on `/studio/collections`, and publication now resolving brand identity from saved settings instead of freeform per-draft input.
- Phase 3 Commit 4 landed branded public collection directories on `/brands/[brandSlug]`, including public brand page contracts, published-collection preview queries, signed preview-image resolution, brand-settings-driven presentation metadata, and navigation updates so the public surface now has a real brand root instead of only deep collection pages.
- Phase 3 Commit 5 landed owner-scoped publication merchandising controls, including persisted featured-release plus display-order fields on `PublishedCollection`, authenticated merchandising updates on `PATCH /api/studio/collections/[collectionDraftId]/publish`, automatic featured-release exclusivity per brand, and studio/public surfaces that now respect saved release ordering.
- Phase 3 Commit 6 landed durable storefront landing copy, including saved brand-route headline, description, and featured-release label fields inside studio settings, public brand-page rendering from those saved settings, backwards-compatible theme fallbacks for older brands, and verification fixes so the shared/database packages build cleanly with the current collection-publication schema.
- Phase 4 Commit 1 landed the first metadata-hosting slice, including shared public metadata contracts, public collection metadata manifest and per-edition JSON routes on `/brands/[brandSlug]/collections/[collectionSlug]/metadata`, metadata derivation from immutable published collection snapshots, and studio/public links into those metadata endpoints.
- Phase 4 Commit 2 landed durable public asset hosting for published collections, including public-object references on `PublishedCollectionItem`, publication-time copying of curated generated assets into the public bucket, cleanup on unpublish and snapshot replacement, public read models that now prefer stable public media URLs, and legacy fallback to signed private-storage URLs for older publications.
- Phase 4 Commit 3 landed the first contract-publication slice, including the real `@ai-nft-forge/contracts` helper package, public contract manifests on `/brands/[brandSlug]/collections/[collectionSlug]/contract`, token-uri routes on `/brands/[brandSlug]/collections/[collectionSlug]/token-uri/[tokenId]`, Base Sepolia/Base chain descriptors, and studio/public links into those contract-facing surfaces.
- Phase 5 Commit 1 landed the premium storefront and white-label slice, including preset-driven brand themes in studio settings, published-snapshot storefront merchandising on `PublishedCollection`, grouped public brand/collection read models, a redesigned public brand landing and collection launch page, and browser-smoke fixture support for public storefront routes.
- Phase 6 Commit 1 landed generated-asset moderation with owner-scoped approve/reject/reset controls, collection curation safeguards, and moderation-aware studio asset and collection read models.
- Phase 6 Commit 2 landed worker-owned reconciliation with persisted runs and issues, manual `/ops` run/repair/ignore controls, repairable public-asset recopy and draft-downgrade actions, scheduler automation, studio invalid-draft warnings, and `/ops` smoke coverage for reconciliation flows.
- Phase 7 Commit 1 landed the public self-host release surface, including Apache-2.0 licensing, a public README, Dockerfiles for app services, a single-node self-host Compose stack, env/deployment/operator docs, release checklist guidance, and CI validation for compose config plus Docker builds.
- Post-phase Wallet UX Commit 1 landed Base Account and injected-wallet authentication on `/sign-in`, SIWE-aware server verification on top of the existing nonce/session contract, a shared Wagmi-based wallet provider layer for the web app, an owner-wallet connection picker on `/studio/collections`, and an auth nonce generator updated to meet SIWE nonce requirements.
- Post-phase Commerce Commit 1 landed public item-level reservations, provider-gated hosted checkout routes, a manual payment-provider boundary for self-host validation, lazy reservation expiry, and sold-count/storefront updates applied after successful checkout completion.
- Post-phase Commerce Commit 2 landed Stripe-hosted checkout integration, webhook-driven completion and expiry handling, explicit publication machine-pricing fields, studio pricing controls, and public-provider-aware checkout UX on top of the existing reservation flow.
- Post-phase Commerce Commit 3 landed owner-side commerce administration on `/studio/commerce`, including dashboard aggregation, owner-scoped manual completion and checkout release actions, Stripe-session expiration on owner cancellation, and fulfillment status plus notes tracked separately from payment completion.

## Important Decisions

- The repo is being treated as a clean foundation start rather than a partially built application.
- `docs/project-state.md` is the durable source of project context for future sessions.
- `docs/_local/current-session.md` is local restart and handoff memory and should not be committed.
- Phase 1 should focus on repository foundation, baseline architecture, and self-hostable development setup before feature work.
- Product positioning remains B2B white-label first with premium storefront quality as a primary differentiator.
- The monorepo toolchain baseline is pnpm workspaces plus Turbo.
- Shared repo config lives in `packages/config`.
- `apps/web` uses Next.js App Router route groups to keep marketing, studio, public, and ops concerns separate from the start.
- `packages/ui` is the shared UI boundary for reusable shell primitives.
- `packages/shared` is the shared boundary for auth and worker schemas plus env parsing helpers.
- The worker runtime uses BullMQ with Redis and keeps product job families deferred behind a noop foundation queue.
- `packages/database` owns the Prisma schema, migrations, and thin repository boundary for users, auth nonces, auth sessions, workspaces, brands, and audit logs.
- Prisma 7 configuration is handled with `prisma.config.ts`, while the runtime client uses `@prisma/adapter-pg`.
- Wallet authentication now uses a server-issued nonce, a server-reconstructed sign-in message, server-side signature verification, and a database-backed HTTP-only session cookie.
- Local development now uses Docker Compose under `infra/docker` for PostgreSQL, Redis, MinIO, and bucket bootstrap, while the web app and worker continue to run from workspace scripts.
- The local Compose stack uses dedicated host ports so Phase 1 services do not collide with unrelated local PostgreSQL or Redis installs.
- Source asset intake now uses server-issued signed `PUT` uploads into the private bucket plus an explicit completion call that verifies object existence before database state changes to `uploaded`.
- The first source asset intake slice is user-owned because the studio shell does not yet expose workspace-bound upload context.
- The first generation orchestration slice uses a persisted `GenerationRequest` record as the system of record for queue lifecycle, with the web app dispatching BullMQ jobs and the worker owning state transitions and result summaries.
- The first generated-output slice uses a private-bucket adapter boundary that can either copy source assets deterministically or validate artifacts produced by an external HTTP backend, and it only marks a generation succeeded after `GeneratedAsset` rows are committed.
- The first browser workflow should orchestrate control-plane actions only: request signed upload and download intents, confirm uploads explicitly, dispatch generation jobs, and poll read models without moving long-running work or private object bytes through the Next.js server.
- The first concrete generation backend should remain standalone behind the existing HTTP contract so the deterministic transformation implementation can later be replaced by a model-backed service without reopening worker, web, or database boundaries.
- Keep the standalone generation backend provider-based so deterministic rendering remains a safe default while ComfyUI and future model backends can be introduced without reopening the worker or web contracts.
- The standalone generation backend should expose separate liveness and readiness diagnostics, with readiness delegated to the active provider so ComfyUI reachability failures surface before operator-driven generation attempts.
- The web ops surface should consume generation-backend diagnostics from the configured backend URL rather than duplicating backend state inside the web app.
- Persisted ops history and alert delivery should be generated from the worker side through an explicit capture command so the web app remains a read/control plane rather than a background scheduler.
- Automatic persisted ops capture should still live in the worker and coordinate through Redis leasing so multi-replica deployments do not duplicate scheduled captures while the web app stays read/control plane only.
- External alert delivery should stay generic and worker-owned through a configurable outbound webhook rather than coupling the repo to a single vendor-specific notification service.
- Persisted active alerts should support explicit owner-scoped acknowledgment in the web control plane, but acknowledgment reset should remain worker-owned so changed or recurring alert conditions resurface automatically.
- Persisted alert mute policy should stay owner-scoped, time-bounded, and delivery-focused so operators can suppress noisy alerts without hiding active alert state from `/ops` or reopening the workspace-role problem.
- Owner-scoped webhook routing policy should only affect external webhook delivery; audit-log persistence remains mandatory so `/ops` keeps a complete operator-facing alert timeline.
- Owner-scoped webhook delivery schedules should only affect the external webhook channel; audit-log persistence remains mandatory so off-hours suppression does not hide alert history from `/ops`.
- Owner-scoped webhook escalation policy should only affect repeated external webhook reminder delivery for active unacknowledged alerts; audit-log persistence remains mandatory and unchanged-alert reminders must respect existing routing, schedule, and mute policy.
- Collection authoring should stay owner-scoped and generated-asset-driven until fuller multi-brand and multi-operator permissions exist; public publication should consume immutable published snapshots rather than mutable drafts directly, while saved owner-scoped studio settings now provide the single publication target for the current phase.
- Saved studio brand settings should also own public landing headline, description, accent color, and featured-release labeling so deeper white-label presentation remains config-driven rather than hardcoded into public route components.
- Public storefront status, supply, CTA, and hero-media presentation should also remain owner-managed, collection-level merchandising stored on immutable published snapshots rather than inferred from mutable draft state.
- Public metadata hosting should resolve from immutable published collection snapshots and may issue fresh signed generated-asset URLs at read time while private object storage remains the source of truth ahead of fuller contract and asset-publication work.
- Public contract manifests and token-uri routes should also resolve strictly from immutable published collection snapshots so chain-publishing inputs and recorded onchain state stay aligned with the already-published public release boundary.
- Onchain deployment and minting should remain owner-signed control-plane actions: the repo may prepare intents, open wallet flows, verify chain receipts, and record submitted transactions, but it must not require server-held private keys.
- The server should only persist deployment and mint records after verifying the submitted transaction hash against the configured chain RPC, expected calldata, and resulting contract or token ownership state.
- Reconciliation should also re-verify recorded deployments and mints against live chain state, persist drift issues for operators, and keep additional minting blocked while open onchain drift issues exist for a publication.
- Commerce should continue reserving specific published collection items before checkout, keep the published snapshot immutable, use explicit publication pricing fields for hosted payment providers, and support `manual`, `stripe`, and `disabled` provider modes without moving onchain signing or inventory ownership into the server.
- Once a published collection has recorded deployment or mint activity, publication-state mutations that would change the onchain release boundary should stay blocked to preserve immutable snapshot semantics.
- Published collection media should be promoted into the configured public bucket at publication time and referenced from immutable published-item records, while older publications without public copies should remain readable through signed private-storage fallback until republished.
- Repository push safety should use versioned hooks under `.githooks`, delegate verification to `scripts/verify-push.sh`, and expose `pnpm safe-push` as the explicit verify-then-push command without double-running the build in the same invocation.
- Retry ergonomics should preserve the failed request's pipeline and requested variant count by default so operators can quickly rerun the same job without re-entering parameters.
- Generated asset moderation should stay owner-scoped for now, default new outputs to `pending_review`, backfill legacy outputs to `approved`, and block non-approved assets from entering review-ready or published collection flows.
- Deeper ops controls should stay authenticated and owner-scoped until workspace-level operator roles exist; the public `/ops` surface should stay limited to coarse runtime diagnostics.
- Reconciliation should stay worker-owned, persist normalized issue records per owner, and only auto-repair the explicitly supported cases of missing published public assets and invalid draft status downgrades.
- The public release target is Apache-2.0 source availability plus single-node Docker Compose self-hosting; package-registry publishing, Kubernetes, and hosted SaaS remain out of scope.
- GitHub `origin` is configured and `main` tracks the remote.

## Deferred / Not Yet Implemented

- Richer commerce fulfillment automation
- Multi-brand administration
- Package-registry publishing, Helm/Kubernetes orchestration, and hosted SaaS deployment

## Risks / Watchouts

- The repository now includes app Dockerfiles and a single-node self-host Compose stack, but verification of that packaging surface still depends on a working local Docker daemon and production users still need their own operational hardening around secrets, TLS, backups, and process supervision.
- The repository now ships a ComfyUI-backed generation path, but production deployments still need a separately operated ComfyUI instance, model files, and GPU capacity planning.
- The ops surface now exposes backend liveness/readiness plus authenticated queue depth, rolling owner-scoped metrics, persisted observability history, active-alert acknowledgment and mute controls, owner-scoped webhook routing, delivery-schedule, escalation policy, reconciliation automation health, persisted reconciliation issues, and owner-scoped repair controls, but cross-user/workspace controls are still deferred.
- The studio and public surfaces now expose per-asset generation history, owner-scoped collection drafts, durable studio settings, storefront merchandising, preset-driven public presentation, published collection launch pages, item-level manual or Stripe-hosted checkout, and owner-side commerce administration, but richer fulfillment automation and multi-brand administration are still deferred.
- New publications now use durable public asset URLs for collection and metadata image delivery, but older publications still require republish to gain public copies.
- The repo now supports Base Account and injected-wallet session auth plus shared wallet-driven deployment and mint flows with recorded onchain ledgers and reconciliation rechecks, and it now ships a first-party reservation plus manual or Stripe-hosted checkout path with owner-side commerce recovery and fulfillment tracking, but richer multi-wallet account-abstraction options and fulfillment-aware wallet flows are still limited.
- Planning docs should remain durable; avoid locking in low-level implementation details before the foundation lands.
- `docs/_local/` must stay local-only and must never hold secrets.

## Standard Verification

- `ls -la`
- `find . -maxdepth 3 -type f | sort`
- `pnpm install`
- `pnpm setup:githooks`
- `pnpm verify:push`
- `pnpm format-check`
- `pnpm prisma:validate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm --filter @ai-nft-forge/web exec playwright install chromium`
- `pnpm test:smoke`
- `pnpm --filter @ai-nft-forge/worker ops:capture`
- `pnpm worker:health`
- `pnpm generation-backend:health`
- `pnpm generation-backend:ready`
- `pnpm infra:config`
- `pnpm infra:selfhost:config`
- `docker build -f apps/web/Dockerfile .`
- `docker build -f apps/worker/Dockerfile .`
- `docker build -f apps/generation-backend/Dockerfile .`
- `pnpm infra:ps`
- `DATABASE_URL='postgresql://ai_nft_forge:ai_nft_forge@127.0.0.1:55432/ai_nft_forge?schema=public' pnpm db:migrate:status`
