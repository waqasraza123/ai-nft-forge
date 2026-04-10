# Phases

## Phase 1: Foundation

Establish repository structure, base tooling, web and worker boundaries, database and queue integration points, local object storage direction, and Docker-first development setup.

## Phase 2: Upload And Generation Pipeline

Add source asset intake, queue-backed generation orchestration, result handling, and operator-visible job state.

## Phase 3: Collection Draft System

Add curated asset selection, collection assembly, metadata preparation, and draft management.

## Phase 4: Contracts And Publication

Add contract path, collection publication flow, metadata hosting path, and initial chain publishing support.

## Phase 5: Premium Storefront And White-Label Presentation

Add branded public presentation, stronger merchandising surfaces, and white-label customization depth.

## Phase 6: Hardening, Operations, Moderation, Reconciliation

Add observability, moderation workflow, retries, reconciliation, and operational safeguards.

## Phase 7: Open-Source Packaging And Self-Host Docs

Harden the repository for public release, document setup and operations, and package the project for external adopters.

## Current State

Phase 1 is complete. Phase 2 is complete for the current upload/generation scope. Phase 3 is complete for the current draft/publication-authoring boundary. Phase 4 is complete for the current contracts-and-publication scope, including published collection delivery, metadata hosting, durable public asset promotion, and published-snapshot-backed contract and token-uri surfaces. Phase 5 is complete for the current premium storefront and white-label presentation scope, including preset-driven brand theming, published-snapshot storefront merchandising, grouped public launch surfaces, and redesigned brand/collection public routes. Phase 6 is complete for the current hardening scope, including generated-asset moderation, worker-owned reconciliation, persisted reconciliation history/issues, repairable operator actions, and `/ops` automation visibility. Phase 7 is complete for the current public release scope, including Apache-2.0 licensing, Dockerized app services, a single-node self-host Compose path, current docs, and release-grade CI checks. No Phase 8 is defined yet; the repo has also landed post-phase onchain slices covering deployment and mint intent preparation, wallet-driven browser execution, server-verified transaction recording, immutable mint ledgers against published snapshots, and worker-owned chain-state reconciliation for recorded deployments and mints.
