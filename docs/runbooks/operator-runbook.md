# Operator Runbook

This runbook covers the authenticated `/ops` surface and the operator responsibilities that matter in the released repository.

## What `/ops` now shows

- generation backend liveness and readiness
- queue depth and active generation diagnostics
- persisted observability captures
- active alerts, mutes, routing, schedule, and escalation policy
- capture automation freshness
- reconciliation automation freshness
- latest reconciliation run plus open issues

## Daily checks

- confirm the generation backend is `ready`
- confirm queue health is not `unreachable`
- confirm capture automation is `healthy`
- confirm reconciliation automation is `healthy`
- review any open critical alerts
- review any open critical reconciliation issues

## Reconciliation actions

Use the `/ops` reconciliation section to:

- run reconciliation manually
- repair missing published public assets
- downgrade invalid drafts back to `draft`
- ignore non-actionable issues after deliberate review

Repairable issues:

- `published_public_asset_missing`
- `draft_contains_unapproved_asset`
- `review_ready_draft_invalid`

Non-repairable issues stay visible for investigation:

- `source_asset_object_missing`
- `generated_asset_object_missing`
- `published_hero_asset_missing_from_snapshot`

## Moderation workflow

- moderation remains owner-scoped in `/studio/assets`
- only approved generated assets should remain curated
- if a curated asset is later rejected, reconciliation should flag the draft and `/studio/collections` should show the invalidity warning

## Alerting guidance

- use mute only for bounded suppression, not as a substitute for repair
- use webhook delivery only after confirming the receiver is stable
- review escalation settings if alerts are being acknowledged too late

## Failure escalation

- if the generation backend is reachable but not ready, check provider configuration first
- if queue diagnostics are stale or unreachable, validate Redis connectivity and worker health
- if reconciliation automation is stale, run a manual reconciliation and inspect worker logs
- if private objects are missing, treat it as storage corruption or manual bucket drift and investigate backups
