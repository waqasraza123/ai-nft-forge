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

Owners choose `operator` or `viewer` when creating direct members or wallet-address invitations. Invitations remain wallet-bound, auto-accept only for users without an existing effective workspace, and persist the invited role into `WorkspaceMembership.role`.
