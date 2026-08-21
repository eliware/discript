# Release checklist

Before release, review the diff and version, run `npm test`, `npm run test:gaps`, `npm run docs:check`, `npm run package:check`, `npm pack --dry-run`, and the configured audit check. Confirm no local environment files or credentials are packaged.

Verify the CLI bin, README, examples, specs, and runtime files in the packed artifact. Publish through the standard workflow, test a clean install, create the release tag, and document migrations or changed safety behavior. Follow [release operations](../operations/release.md).
