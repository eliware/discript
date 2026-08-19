# Testing

Run the standard suite with:

```sh
npm test
npm run lint
npm run package:check
```

Use `npm run test:live` for read-only Discord integration checks and `npm run test:live:mutations` only when the configured test guild is disposable. Live mutation tests must use unique names, clean up created resources, and never target production guilds.

Tests follow a 1:1 implementation mapping where practical: `src/foo.mjs` maps to `tests/foo.test.mjs`; decomposed modules map to their own test files. Cross-cutting behavior belongs in an integration test, not an edge-case catch-all file.

