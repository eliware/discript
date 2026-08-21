# Contribution workflow

Start by inspecting the working tree and the relevant architecture or specification pages. Make the smallest coherent change, keep implementation and tests together, and update examples and docs when user-visible behavior changes.

Run focused tests first, then the broader checks appropriate to the change:

```bash
npm test
npm run test:gaps
npm run docs:check
git diff --check
```

Use small commits with imperative messages at solid checkpoints. Before publishing, review the diff, confirm no secrets or local `.env` files are included, update release notes when behavior or packaging changes, and follow the [release checklist](release-checklist.md). Push only after local validation is complete.

For Discord mutations, validate with dry-run first and use explicit approval for destructive operations. For daemon or MCP changes, also test startup, shutdown, reconnect, and transport-specific behavior.
