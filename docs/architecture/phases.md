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

Phase 1 is complete. Phase 2 is still active and now includes source asset intake, generation orchestration, generated-output persistence, the standalone generation backend, the ComfyUI provider path, provider-aware ops diagnostics for backend liveness and readiness, explicit studio retry flow plus richer latest-generation metadata, and authenticated ops queue depth plus owner-scoped generation activity/retry controls.
