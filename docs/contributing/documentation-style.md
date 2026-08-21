# Documentation style

Describe observable behavior, prerequisites, safety boundaries, and expected output. Prefer short runnable examples and link to the canonical reference instead of duplicating command tables. Use `.ds` comments for tutorial context, never secrets or real production IDs.

When behavior changes, update the relevant spec, user/developer guide, examples index, and release notes. Check relative links and example paths with `npm run docs:check`; keep headings and filenames stable so agents can discover them.
