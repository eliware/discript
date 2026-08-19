# Safety and Exit Status Contract

## Operation classes

Discript operations are classified as read-only, mutating, or destructive. Destructive operations include deletion, bans, kicks, timeouts, removals, and other high-impact changes.

## Dry-run

Mutating and destructive operations shall support dry-run behavior where Discord can validate the request without applying it.

Dry-run shall validate inputs, resolve targets where possible, check relevant permissions where possible, return a structured preview, and make no state-changing API call.

The CLI exposes dry-run with `--dry-run`. Scripts expose it through an equivalent operation option:

```discript
preview = discord.messages.delete(channelId, messageId, dryRun: true)
```

## Force approval

Destructive operations require explicit force approval. The CLI uses `--yes` or `-y` as the force directive:

```sh
discript messages delete --channel <id> --message <id> --yes
discript moderation ban --guild <id> --user <id> --yes
```

Scripts require the equivalent internal directive:

```discript
discord.messages.delete(channelId, messageId, force: true)
discord.moderation.ban(guildId, userId, force: true)
```

Without force approval, the operation shall fail before making a state-changing API call. Dry-run may preview a destructive operation without force, but must never apply it.

## Normalized operation results

Operations should expose a normalized result containing success state, an exit code, and either a value or error:

```text
{ ok: true, exitCode: 0, value: ... }
{ ok: false, exitCode: 5, error: { code: "discord.missing_permission", message: "..." } }
```

## Script-level status flow

Scripts shall be able to inspect an operation exit code and branch without terminating the whole process:

```discript
result = try {
  discord.messages.delete(channelId, messageId, force: true)
}

if result.exitCode == 0 {
  print("Deleted")
} else if result.exitCode == 5 {
  print("Permission denied")
} else {
  exit(result.exitCode)
}
```

The language shall distinguish returning a value, capturing a failed operation result, and exiting the entire script. An explicit exit may include a message:

```discript
exit(10, "Required channel was not found")
```

## Process exit status

The CLI process shall return the final command or script exit code:

- `0`: success
- `1`: general runtime failure
- `2`: invalid CLI or input
- `3`: parse failure
- `4`: authentication failure
- `5`: permission or authorization failure
- `6`: timeout or cancellation
- `10+`: script-defined application statuses

Machine-readable failures go to stderr when JSON output is enabled; successful results remain on stdout.
