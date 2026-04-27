# Operator Runbook

This runbook covers the authenticated `/ops` surface and the operator responsibilities that matter in the released repository.

## Access roles

- owners can manage workspace policy, publication, onchain, lifecycle, member, and invitation controls
- operators can run day-to-day production actions such as asset intake, generation, moderation, commerce recovery, alert triage, and reconciliation
- viewers can inspect studio, commerce, ops, audit, retention, and directory state, but mutation controls are disabled in the UI and rejected by the API
- owners can change an existing non-owner member between operator and viewer from `/studio/settings`; ownership transfer remains a separate escalation workflow
- owners can change a non-expired pending invitation between operator and viewer; expired invitation rows are retained as immutable history and should be replaced with a fresh invitation
- member and invitation role-change audit events show the previous role and the new role in studio history, `/ops/audit`, and CSV export
- demoting or removing an operator automatically cancels that operator's pending ownership-transfer request, if one exists
- owners can export the selected workspace access review from `/studio/settings` or `/api/studio/settings/access-review?format=csv`; the export combines members, invitations, role escalations, recent access audit history, a current/changed freshness signal, and summary deltas against the latest recorded attestation
- owners can record an access-review attestation from `/studio/settings`; it writes `workspace_access_review_recorded` with a SHA-256 evidence hash into the workspace audit stream, and the hash is deterministic for the access evidence rather than the export timestamp
- owners can retrieve prior attestations from `/api/studio/settings/access-review/attestations?format=csv` for governance packets that need only recorded review evidence rather than the full current access snapshot
- owner-only workspace export includes the same access-review freshness and summary-delta fields, so offboarding packets show whether governance evidence is current without requiring a separate access-review export
- offboarding and retention overview entries treat `changed` or `never_recorded` access-review evidence as `access_review_not_current`; record a current access review before scheduling final decommission

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
- export the workspace access review before scheduled governance reviews or before offboarding a workspace, then record the review so the evidence hash appears in studio and ops audit history; if the settings panel marks the review as changed, review the summary deltas, then re-approve the current access state before recording a new review
- when exporting a workspace for archive or decommission review, check `access_review_attestation_status` in the CSV; do not treat an offboarding packet as governance-current when it is `changed` or `never_recorded`, and expect decommission scheduling to reject the workspace until the access review is current

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

- moderation is available to owners and operators in `/studio/assets`
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
