# Status Models

These are durable planning states, not implemented enums.

## Asset Lifecycle

- `source_uploaded`
- `generation_requested`
- `generation_running`
- `generation_succeeded`
- `generation_failed`
- `asset_curated`
- `asset_approved`
- `asset_rejected`
- `metadata_ready`
- `published`
- `minted`

## Collection Lifecycle

- `draft`
- `review_ready`
- `approved`
- `scheduled`
- `published`
- `paused`
- `closed`

## Job Lifecycle

- `queued`
- `running`
- `succeeded`
- `failed`
- `retry_scheduled`
- `cancelled`

## Notes

- These states should guide Phase 1 schema and workflow design.
- Keep status models explicit and operationally legible.
- Do not collapse curation, publication, and minting into a single status path.
