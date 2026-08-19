# Release

Release preparation should include:

```sh
npm test
npm run lint
npm run package:check
npm audit --omit=dev --audit-level=moderate
npm pack --dry-run
```

Update the package version, changelog/release notes, and relevant documentation. Create a `v*` tag and use the repository’s standard packaging workflow. Verify the published package from a clean install and check that the README, examples, specs, and required runtime files are included.

