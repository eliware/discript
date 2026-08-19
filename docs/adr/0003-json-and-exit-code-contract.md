# ADR 0003: JSON and exit-code contract

## Status

Accepted.

## Decision

The CLI returns process exit statuses and supports structured JSON/JSONL output. Scripts may call `exit(code, message)` so an agent can branch on an intentional result.

## Consequences

Machine consumers do not need to scrape human output. Exit codes and stable error codes become compatibility concerns and must be documented when added.

