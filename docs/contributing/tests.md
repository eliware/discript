# Tests

Place unit tests under `tests/` with the same relative module name as the implementation. Keep one test file per module; put only genuinely cross-cutting behavior in aggregate files. For example, parser modules belong beside parser tests, while CLI command modules belong under `tests/cli/commands/`.

Prefer deterministic tests with injected adapters and fixtures. Assert returned values, normalized Discord payloads, exit codes, safety decisions, and cleanup behavior rather than implementation details. Cover success, validation failures, destructive approval, dry-run previews, and transport errors where the module owns those decisions.

Useful commands are:

```bash
npm test
npm run test:gaps
npm run docs:check
```

Tests must not read the developer's home environment or require a real token. Live Discord work should be opt-in, use `TEST_GUILD`, and be isolated from the default suite; see the [test guild guide](../developers/test-guild.md).
