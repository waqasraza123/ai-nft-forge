# Security Policy

## Supported Use

This repository is under active development. Security posture is improving phase by phase and should not be assumed complete for production deployment without review.

## Reporting a Vulnerability

Do not open public issues for security vulnerabilities.

Report vulnerabilities privately to the maintainers through the designated private contact path for this repository. Include:

- a concise description of the issue
- affected area or file paths
- reproduction steps if available
- impact assessment
- suggested mitigation if known

## Handling Expectations

Maintainers should:

- acknowledge receipt in a reasonable timeframe
- evaluate severity and exposure
- coordinate a fix and disclosure path
- avoid exposing sensitive details before mitigation is ready

## Sensitive Data Rules

- never commit secrets to the repository
- never place secrets in `docs/project-state.md` or `docs/_local/current-session.md`
- avoid posting credentials, signed URLs, or private infrastructure details in issues or pull requests

## Deployment Note

Self-host operators are responsible for:

- secret management
- network controls
- access control configuration
- dependency patching
- storage security
- GPU and model backend isolation where relevant
