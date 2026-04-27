# Workspace Access Control

Workspace access resolves from the authenticated wallet session to one selected accessible workspace at the web boundary. The selected workspace is stored in the authenticated workspace-selection cookie and is reused across studio and ops surfaces.

## Roles

| Role       | Source                     | Intended use                                                                                                                                                              |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `owner`    | `Workspace.ownerUserId`    | Workspace administration, publication authority, onchain signing, policy control, lifecycle/offboarding control, and all operator workflows.                              |
| `operator` | `WorkspaceMembership.role` | Day-to-day production work inside an active workspace: asset intake, generation, moderation, draft curation, commerce recovery, alert triage, and reconciliation actions. |
| `viewer`   | `WorkspaceMembership.role` | Read-only review access for clients, auditors, support, or stakeholders who need workspace visibility without mutation rights.                                            |

## Capability Matrix

| Capability                                                                                                                                 | owner | operator | viewer |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ----- | -------- | ------ |
| Read selected workspace, assets, generations, collections, commerce, ops, audit, retention, and directory surfaces                         | yes   | yes      | yes    |
| Switch among accessible workspaces                                                                                                         | yes   | yes      | yes    |
| Upload/complete source assets                                                                                                              | yes   | yes      | no     |
| Dispatch or retry generation jobs                                                                                                          | yes   | yes      | no     |
| Download generated outputs                                                                                                                 | yes   | yes      | yes    |
| Moderate generated outputs                                                                                                                 | yes   | yes      | no     |
| Create/edit/reorder collection drafts                                                                                                      | yes   | yes      | no     |
| Publish/unpublish collection snapshots                                                                                                     | yes   | no       | no     |
| Deploy contracts or mint onchain records                                                                                                   | yes   | no       | no     |
| Manage checkout recovery, fulfillment, or automation retry                                                                                 | yes   | yes      | no     |
| Acknowledge/mute alerts or run/repair/ignore reconciliation                                                                                | yes   | yes      | no     |
| Manage alert routing, schedule, escalation, lifecycle, retention, workspace status, decommission, export, brands, members, and invitations | yes   | no       | no     |
| Request ownership transfer                                                                                                                 | no    | yes      | no     |
| Approve/reject ownership transfer                                                                                                          | yes   | no       | no     |

## Route Rules

- Read routes keep accepting any selected accessible workspace role unless the route is explicitly owner-only.
- Active workspace mutation helpers reject `viewer` with `FORBIDDEN`.
- Owner-only helpers continue rejecting both `operator` and `viewer`.
- Inactive workspaces stay readable, but non-lifecycle mutations still fail with `WORKSPACE_NOT_ACTIVE`.
- Fleet mutation routes must check the target workspace role from `availableWorkspaces`; a selected owner role on one workspace must not authorize mutation of a different viewer workspace.

## Invitation Semantics

Owners choose `operator` or `viewer` when creating direct members or wallet-address invitations. Owners can also change a non-expired pending invitation between `operator` and `viewer` from `/studio/settings` or `PATCH /api/studio/settings/invitations/[invitationId]`. Invitations remain wallet-bound, auto-accept only for users without an existing effective workspace, and persist the current invited role into `WorkspaceMembership.role`. Expired invitation rows stay immutable history and must be replaced with a new invitation when access is still needed. Invitation role updates record both previous and new roles in the workspace audit stream.

## Member Role Changes

Owners can change an existing non-owner workspace member between `operator` and `viewer` from `/studio/settings` or `PATCH /api/studio/settings/members/[membershipId]`. The route is selected-workspace scoped, rejects non-owners, rejects owner-role assignment, returns the updated member read model, and records `workspace_member_role_updated` in the workspace audit log with both previous and new roles. No ownership transfer happens through member role updates; owner changes continue to use the role-escalation workflow.

## Role Escalation Invalidation

Only active `operator` members can hold a pending ownership-transfer request. When an owner changes an operator to `viewer` or removes an operator membership, the settings service cancels any pending ownership-transfer request for that target user in the same transaction and records `workspace_role_escalation_canceled`. This keeps stale escalation approvals from surviving after the target no longer has operator access.

## Access Review Export

Owners can export the selected workspace access review from `/studio/settings` or `GET /api/studio/settings/access-review`. The JSON response and CSV mode share the same owner-only service read model and include:

- the owner row plus current non-owner workspace members
- pending, expiring, and expired wallet-address invitations
- recent ownership-transfer role escalation requests, including pending requests
- recent workspace access-governance audit entries for member, invitation, role, and ownership actions

The export is selected-workspace scoped and does not traverse the broader estate. Role-change rows preserve previous and new roles where audit metadata exists, so the CSV can be handed to an access review without inspecting raw database records. JSON and CSV output also include an attestation freshness signal: `never_recorded` means no prior review exists, `current` means the latest recorded review hash still matches the current evidence payload, and `changed` means workspace access evidence has diverged since the latest recorded review. When a prior attestation exists, the report includes summary deltas for member, invitation, role-escalation, pending-escalation, and audit-entry counts so owners can quickly see the scale of drift before recording a new review.

Owners can also record an access-review attestation with `POST /api/studio/settings/access-review`. The service generates the same report payload, computes a SHA-256 evidence hash over the workspace, rows, and summary counts, and writes `workspace_access_review_recorded` to the workspace audit log with the report timestamp, hash, and summary counts. The evidence hash intentionally excludes the non-evidence `generatedAt` timestamp, prior `workspace_access_review_recorded` audit rows, and operational lifecycle/decommission audit rows, so recording an attestation or moving through offboarding workflow events does not invalidate the attested access snapshot when membership, invitations, ownership, and role-escalation evidence did not change. The settings export and workspace offboarding/export verification both consume the shared `apps/web/src/server/workspace-access-review.ts` evidence builder, so row construction, summary counts, hashes, freshness, and deltas stay aligned across governance packets. The attestation stores evidence metadata in the audit stream rather than persisting another copy of the report, so ops audit CSV and the next access-review export can prove that a specific review snapshot was acknowledged. `/ops/audit` exposes access, ownership-transfer, workspace lifecycle, and workspace policy categories from the same selected-workspace audit stream, so operational lifecycle/decommission rows remain visible for review even though they are excluded from access-review hashing.

Prior attestations are available from `GET /api/studio/settings/access-review/attestations` in JSON or CSV format. This route is owner-only, reads only `workspace_access_review_recorded` audit events for the selected workspace, and reconstructs the governance history from audit metadata so review evidence remains portable without a second persistence model. The studio settings audit panel uses the same comparison to show owners whether the current access review is unrecorded, still current, or changed since the latest attestation, including the same summary deltas when access evidence has drifted.

Owner-only workspace export at `GET /api/studio/workspaces/[workspaceId]/export` embeds the same access-review verification object in JSON and emits the same freshness and delta fields in CSV. Offboarding packets therefore carry both archive readiness and governance-evidence freshness without requiring operators to pull a second access-review export before every archive or decommission decision. The offboarding overview and retention fleet report also include compact access-review verification, and any `never_recorded` or `changed` access-review state adds `access_review_not_current` to offboarding cautions. Decommission scheduling, retained decommission notice recording, and final decommission execution all require the workspace to remain offboarding-ready; each decommission audit event records the access-review evidence hash used for the gate in `reviewHash` and `reviewGeneratedAt`, plus explicit access-review status/latest-attestation metadata. `/ops/audit` exposes those fields as structured JSON and CSV columns alongside notification kind, retention days, execute-after, export-confirmed, and reason metadata. Owners must record the current access review before scheduling cleanup, sending retained notices, or executing final cleanup.
