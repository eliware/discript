# Discript 10,000-Foot Review

Reviewed against the current `main` worktree and the latest `npm run test:gaps` output.

## Executive summary

Discript has a strong early product foundation: it combines a Discord-focused scripting language, direct CLI commands, reusable scripts, environment access, structured output, guarded mutations, capability policies, runtime compatibility metadata, and agent-oriented workflows. The parser/evaluator design is well decomposed and the project now has broad documentation, examples, package publishing, and a disposable test-guild workflow.

The main maturity gap is not feature breadth. It is confidence in the code paths connecting user input to live Discord behavior. The parser and evaluator internals are well covered, but runtime startup/shutdown, script execution, CLI dispatch, command handlers, and several Discord adapters have low automated coverage. The requirements checklist currently presents a higher level of completion than the test evidence supports for those integration and safety boundaries.

## Current coverage

Latest command:

```sh
npm run test:gaps
```

Result: passed with exit code `0`.

| Scope | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Overall | 89.80% | 83.03% | 92.78% | 95.58% |
| `src` | 89.26% | 78.52% | 91.66% | 93.22% |
| `src/discord` | 90.51% | 84.81% | 99.18% | 99.58% |
| `src/evaluator` | 100.00% | 99.26% | 100.00% | 100.00% |
| `src/parser` | 99.25% | 98.16% | 100.00% | 100.00% |

The suite currently reports 508 passing tests and 9 skipped tests across 82 passing suites, with the live suite passing when explicitly enabled.

## Highest-priority attention areas

### 1. Runtime and CLI integration coverage

The largest risk is the path that turns a user invocation into a Discord operation:

| Module | Statements |
| --- | ---: |
| `src/runtime.mjs` | 0% |
| `src/cli/script.mjs` | 3.33% |
| `src/input.mjs` | 37.50% |
| `src/output.mjs` | 40.00% |
| `src/cli/commands/index.mjs` | 40.00% |
| `src/cli/lifecycle.mjs` | 50.00% |

Add mocked end-to-end tests for file, stdin, inline, and direct-command input; connection failures; script built-ins; JSON/JSONL output; timeout behavior; signal handling; and guaranteed cleanup.

### 2. Mutation safety consistency

The project has the right safety model—dry-run for previews and explicit `--yes`/`force: true` for destructive work—but every command path must prove that model consistently. Some handlers have historically forwarded approval and dry-run options differently, so the safety policy should be tested as a matrix:

| Mode | Expected behavior |
| --- | --- |
| No approval | Reject before mutation. |
| Dry-run | Return a plan and make no Discord change. |
| Explicit approval | Invoke the adapter and return the mutation result. |

This should cover every mutating command, not only the underlying adapter methods.

### 3. Remaining adapter and command-path coverage

The channel adapter now has focused lifecycle, dry-run, validation, webhook,
permission, and thread tests in its existing 1:1 test file. The remaining
lower-confidence areas are smaller command-dispatch branches and error paths
in several Discord resource adapters. Continue adding tests to the existing
mapped files rather than creating edge-case test files.

### 4. CLI command-handler coverage

Many command handlers are between 10% and 43% statement coverage. The handlers are short, but they are the user-facing dispatch layer and should have direct tests for required options, aliases, operation selection, option forwarding, and structured errors.

### 5. Live Discord verification

Live tests are intentionally gated, which is appropriate for normal CI. However, mocked tests cannot prove Discord permission behavior, role hierarchy, channel ordering, voice connectivity, webhook availability, or cleanup semantics. Maintain a small, deterministic live smoke suite against `TEST_GUILD`, run it before releases, and make cleanup failures visible.

### 6. Documentation drift and semantic verification

The repository now has `npm run docs:check`, which verifies:

- Relative Markdown links
- All 66 CLI catalog commands are named in the CLI reference
- All 157 `.ds` examples parse

This catches structural drift but not semantic drift such as incorrect option forwarding, permissions, return shapes, or examples that parse but fail at runtime. Add executable documentation checks for representative read-only, dry-run, and approved workflows.

### 7. Packaging and release scope

The package is public and has an isolated tarball-install check. The npm package includes source, binaries, examples, README, `SPEC.md`, and `specs`; it does not include the new `docs/` tree. Decide explicitly whether documentation is GitHub-only or should ship with the package, then align `package.json.files` and release checks.

CI currently runs tests, lint, package packing, and tarball installation, but does not run `npm run docs:check`. Adding it is a small, high-leverage improvement.

## Strengths

- Parser modules are decomposed and very well tested.
- Evaluator modules have effectively complete coverage.
- The language supports composition, imports, callbacks, timers, event handlers, exit-code branching, lexical closures, capability introspection, and runtime compatibility checks.
- Discord capability breadth is good for an early release.
- Channel provisioning supports text, voice, categories, parent changes, uncategorized channels, and ordering.
- Destructive operations have an explicit approval model.
- JSON, JSONL, structured errors, aliases, command discovery, and shell completion support agent use.
- Examples cover fundamentals, Discord operations, agent workflows, clever automation, events, and composition.
- The test guild and gated live-test approach provide a safe path for mutable verification.
- Documentation now has a broad audience-oriented structure and automated structural checks.

## Recommended order of work

1. Expand remaining command-dispatch and Discord-adapter error-path tests.
2. Run a deterministic live smoke suite against `TEST_GUILD` before releases.
3. Add executable documentation checks for representative read-only, dry-run, and approved workflows.
4. Decide whether `docs/` belongs in the npm package.
5. Refresh the requirements checklist using separate implementation, test, live-test, documentation, and CI evidence.

## Bottom line

Discript is feature-rich and directionally coherent, but the next phase should emphasize hardening the execution and mutation boundaries rather than adding more surface area. Improving confidence in runtime lifecycle, CLI dispatch, safety enforcement, and live Discord behavior will produce the largest increase in real-world reliability.
