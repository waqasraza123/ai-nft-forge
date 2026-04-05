# Routes And Jobs

This document defines durable boundary expectations for the first implementation slices. No routes or jobs exist in the repository yet.

## Planned Surface Areas

- Studio web surface for client operations, curation, and collection drafting
- Public web surface for branded collection pages
- Worker surface for asynchronous processing and reconciliation

## Planned Route Groups

- `/studio`
- `/studio/assets`
- `/studio/collections`
- `/studio/settings`
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
- Internal APIs should support the web app and workers without exposing operational controls publicly.
- Route and job design should preserve the B2B white-label model and future multi-tenant concerns.
