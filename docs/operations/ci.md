# CI

CI runs unit tests, lint, package verification, docs checks, and a dry-run package check. Live Discord tests are opt-in and use isolated credentials plus `TEST_GUILD`.

For pull requests run `npm test`, `npm run test:gaps`, `npm run docs:check`, `npm run package:check`, and `git diff --check`. Default jobs must not depend on a home `.env` or live gateway access.
