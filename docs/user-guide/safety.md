# Safe mutations

Discript treats Discord state changes as explicit operations. Use a two-phase workflow:

```sh
discript channels create --guild "$TEST_GUILD" --name staging --dry-run --validate --json
discript channels create --guild "$TEST_GUILD" --name staging --yes --json
```

Destructive actions such as deleting channels, roles, messages, webhooks, threads, invites, or moderation actions require `--yes`/`-y` at the CLI. In scripts, pass `{force: true}`. Use `{dryRun: true}` to preview from script code.

For repeatable automation, validate identifiers and names before mutating, record created IDs, and implement compensating cleanup if a later step fails. Never infer approval from a target name or environment alone.

