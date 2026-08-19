# ADR 0002: Dry-run and destructive approval

## Status

Accepted.

## Decision

State-mutating operations expose a dry-run path. Destructive operations require explicit approval: `--yes`/`-y` at the CLI or `{force: true}` inside a script.

## Consequences

Agents can plan and validate changes without modifying Discord. Scripts can carry their approval policy with the operation. Every new mutation must be classified and tested in both preview and approved modes.

