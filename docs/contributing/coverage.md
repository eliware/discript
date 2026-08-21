# Coverage

Coverage is a signal that the language and CLI behavior are exercised; it is not a substitute for meaningful assertions. Run the focused test file while developing, then use the repository-wide commands before a checkpoint:

```bash
npm test
npm run test:gaps
```

The `test:gaps` report identifies uncovered statements, branches, functions, and lines. Prioritize externally observable behavior, error paths, safety gates, parser alternatives, and cleanup paths. Small barrel files that only re-export modules do not need artificial tests when Istanbul ignore annotations are appropriate and documented.

Keep tests in the 1:1 module layout described in [tests](tests.md). Do not add tests solely to inflate a percentage, and do not make unit coverage depend on a user's home `.env`, a live Discord guild, or network availability. Live test-guild checks belong in explicit integration workflows.

Examples and docs are checked separately with `npm run docs:check`; a successful coverage run does not prove that examples or links are current.
