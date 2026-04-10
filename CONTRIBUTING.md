# Contributing Guide

## Before You Start

Read these files first:

- `AGENTS.md`
- `docs/project-state.md`
- `docs/_local/current-session.md` if it exists

Treat `docs/project-state.md` as durable repo memory and `docs/_local/current-session.md` as local working memory.

## Contribution Standards

Contributions should:

- preserve the current architecture and phased delivery model
- be production-grade, strongly typed, and validated
- keep changes cohesive and reviewable
- avoid speculative abstractions and low-signal churn
- include tests or verification updates when behavior changes
- avoid unrelated formatting-only edits in active files unless necessary

## Workflow

1. Read the relevant architecture, product, and runbook docs.
2. Confirm the change fits the current active phase.
3. Make the smallest complete change that solves the problem properly.
4. Run the relevant validation commands.
5. Set up the versioned Git hooks with `pnpm setup:githooks` in your clone.
6. Use `pnpm safe-push` when you want an explicit verify-then-push command.
7. Update `docs/_local/current-session.md` at the end of meaningful work.
8. Update `docs/project-state.md` only when long-term architecture, roadmap, constraints, or important decisions change.

## Engineering Rules

- Prefer reusable modules over large multi-purpose files.
- Use descriptive names.
- Do not guess missing requirements; document assumptions explicitly.
- Avoid hardcoded values and one-off hacks.
- Keep request handlers thin; long-running work belongs in jobs and workers.
- Do not commit secrets, credentials, or private tokens.

## Validation

Use the smallest set of commands that proves your change, and prefer the full validation suite before merging broad changes.

Common commands:

```bash
pnpm setup:githooks
pnpm verify:push
pnpm safe-push -- --dry-run origin main
pnpm format-check
pnpm prisma:validate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm validate
```

## Safe Push

This repository uses a versioned pre-push hook at `.githooks/pre-push`.

- Run `pnpm setup:githooks` once per clone to point Git at the versioned hooks path.
- Normal `git push` runs `scripts/verify-push.sh` through the pre-push hook.
- The hook blocks the push if `pnpm build` fails.
- `pnpm safe-push` is the explicit AI-friendly wrapper. It runs the same verifier first and then calls `git push` without double-running the hook verification in the same invocation.

## Pull Request Expectations

A strong change summary should include:

- what changed
- why it changed
- how it was verified
- any follow-up work or known limitations

## Documentation

If your change affects behavior, routes, runtime expectations, or workflow, update the relevant docs in `docs/`.

If your change is meaningful session work, update `docs/_local/current-session.md`.

For release-surface changes, also review `docs/release-checklist.md`, `docs/deployment/environment-reference.md`, and `docs/deployment/self-host-docker-compose.md`.
