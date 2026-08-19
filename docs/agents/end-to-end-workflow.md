# End-to-end agent workflow

Discript is designed for a two-phase agent loop: produce an inspectable plan, then apply that plan only after an explicit approval decision. The same `.ds` source can be supplied as a file, inline source, or stdin.

## 1. Establish the target

The harness supplies the target through environment variables rather than asking the script to guess:

```sh
export TEST_GUILD=1539674201659809822
export TARGET_CHANNEL=1539727398747250768
```

The bot token should come from a secret store or protected process environment. Never put it in generated source or plan output.

## 2. Inventory before planning

Run a read-only script and capture JSON:

```sh
discript examples/agent/backup-guild.ds --json > inventory.json
status=$?
if [ "$status" -ne 0 ]; then
  exit "$status"
fi
```

The harness should validate that the returned guild ID and name match the intended target before constructing mutations.

## 3. Generate a dry-run plan

A plan script should use `dryRun: true` and emit explicit operation records:

```text
guildId = env.TEST_GUILD
channelName = env.TARGET_CHANNEL_NAME
if (guildId == null || channelName == null) {
  exit(2, "set TEST_GUILD and TARGET_CHANNEL_NAME")
}
guild = discord.guilds.get(guildId)
preview = guild.channels.create(channelName, {type: "text", dryRun: true})
print({phase: "plan", targetGuild: guildId, operations: [preview]})
```

Run it as:

```sh
discript plan.ds --json > plan.json
```

The plan is advisory, not a lock: the harness must revalidate the target before apply.

## 4. Obtain explicit approval

Approval belongs outside the generated script when an agent or human must review the plan. A harness should display the target, operation count, destructive operations, and exact approval scope. It should not turn `dryRun` into `force` automatically.

```sh
if [ "${APPROVED:-false}" != "true" ]; then
  echo "Plan generated; approval required" >&2
  exit 2
fi
```

For unattended workflows, approval can be supplied as a signed job input or a protected environment value. Do not treat the presence of a guild ID as approval.

## 5. Apply with script-level approval

The apply phase passes `force: true` only after the external approval gate succeeds:

```text
guildId = env.TEST_GUILD
approved = env.DISCRIPT_APPROVED == "true"
if (guildId == null || approved != true) {
  exit(2, "target or approval missing")
}
guild = discord.guilds.get(guildId)
created = guild.channels.create("agent-managed", {type: "text", force: true})
print({phase: "apply", created: created})
```

The equivalent direct command uses `--yes`:

```sh
DISCRIPT_APPROVED=true discript apply.ds --json
```

## 6. Verify the result

After applying, fetch the resource again and compare its ID, name, type, parent, permissions, or message content with the intended state. Treat verification failure as a distinct outcome from apply failure.

```text
created = guild.channels.create("agent-managed", {type: "text", force: true})
verified = discord.channels.get(created.id)
if (verified.name != "agent-managed") {
  exit(10, "apply completed but verification failed")
}
print({phase: "verified", channel: verified})
```

For multi-step workflows, record each created ID and provide a compensating cleanup path for partial failure. Discord operations are not transactional.

## Exit-code decision tree

| Status | Agent action |
| ---: | --- |
| `0` | Continue and record success. |
| `1` | Inspect runtime/resource failure; retry only after inventory. |
| `2` | Correct input or obtain approval; do not retry unchanged. |
| `3` | Fix generated source before execution. |
| `4` | Repair token/configuration through the secret/config path. |
| `5` | Check Discord permissions, hierarchy, access, and rate limits. |
| `6` | Treat as timeout; inspect whether remote work completed before retry. |
| Custom nonzero | Follow the script’s documented branch, such as rollback or verification failure. |

## Safe harness checklist

- Pin the target guild and channel IDs.
- Capture inventory, plan, apply, and verification output separately.
- Pass `--json` and check the process status.
- Require explicit approval for every destructive operation.
- Redact tokens, webhook secrets, and sensitive content.
- Re-inventory after timeouts before retrying.
- Keep cleanup scripts narrowly scoped to recorded IDs.
