# Discript

Discript is an early-stage scripting language and CLI for programmatic Discord interaction, designed for developers, AI agents, and coding harnesses.

## Requirements

- Node.js 26 or newer
- A Discord bot token in `DISCORD_TOKEN`
- The bot must be able to view the target guilds and channels

## Setup

```sh
npm install
cp .env.example .env
# edit .env with a private Discord bot token
```

For local or private installation, use the Git SSH URL or build a tarball:

```sh
npm install git+ssh://git@github.com/eliware/discript.git
npm pack
npm install ./discript-1.0.0.tgz
```

The package is currently marked private and is not publishable to npm.

## Usage

List guilds with a direct CLI command:

```sh
npm start -- guilds list --json
```

Discover supported direct commands or generate shell completion scripts:

```sh
npm start -- commands list --json
npm start -- completion bash > /tmp/discript-completion.bash
npm start -- completion zsh
npm start -- completion fish
```

Inspect the connected bot identity:

```sh
npm start -- bot get --json
```

Common singular and abbreviated resource names are accepted, such as `msg send`, `chan list`, and `guild list`.
Unknown commands include nearby command suggestions; JSON errors expose them under `details.suggestions`.

List channels in a guild:

```sh
npm start -- channels list --guild <guild-id> --json
```

Look up a guild or channel:

```sh
npm start -- guilds get --guild <guild-id> --json
npm start -- channels get --channel <channel-id> --json
```

Discover members and roles:

```sh
npm start -- members list --guild <guild-id> --json
npm start -- roles list --guild <guild-id> --json
```

Read guild invites, emojis, and stickers:

```sh
npm start -- invites list --guild <guild-id> --json
npm start -- emojis list --guild <guild-id> --json
npm start -- stickers list --guild <guild-id> --json
```

Invite creation and deletion are guarded mutations; use `--yes` (or `-y`) and preview with `--dry-run`:

```sh
npm start -- invites create --guild <guild-id> --channel <channel-id> --duration 3600 --yes --json
npm start -- invites delete --guild <guild-id> --invite <invite-code> --yes --json
```

Scheduled events support discovery and guarded lifecycle operations:

```sh
npm start -- events list --guild <guild-id> --json
npm start -- events create --guild <guild-id> --name "Town hall" --start "2030-01-01T00:00:00Z" --yes --json
npm start -- events update --guild <guild-id> --event <event-id> --name "Updated" --yes --json
npm start -- events delete --guild <guild-id> --event <event-id> --yes --json
```

Voice connections support guarded join/leave and status inspection:

```sh
npm start -- voice status --guild <guild-id> --json
npm start -- voice join --channel <voice-channel-id> --yes --json
npm start -- voice leave --guild <guild-id> --yes --json
```

Scripts can declare event handlers. The incoming Discord payload is available as `event` inside the handler:

```text
on("messageCreate") {
  print(event.content)
}
```

When a script registers one or more handlers, it remains running until a termination signal is received; `--timeout <milliseconds>` can bound that lifetime for automation.

Use bounded `for-in` loops to process result collections:

```text
members = discord.guilds.get("<guild-id>").members.list()
for (member in members) {
  print(member.username)
}
```

Scripts can schedule asynchronous work and compose concurrent operations:

```text
every(60000) { print("heartbeat") }
after(1000) { print("started") }
values = parallel(sleep(10), sleep(10))
```

Arrow callbacks can transform and select collections:

```text
names = map(members, member => member.username)
active = filter(members, member => member.roles != null)
```

Reusable script functions use `fn` and `return`:

```text
fn announce(name) {
  return "Hello " + name
}
print(announce("Discord"))
```

Reusable source files can be loaded into the current script scope:

```text
import "./shared.discript"
print(announce("Discord"))
```

Threads support inspection and guarded lifecycle operations:

```sh
npm start -- threads list --channel <channel-id> --json
npm start -- threads create --channel <channel-id> --name "topic" --yes --json
npm start -- threads archive --channel <channel-id> --thread <thread-id> --yes --json
```

Role changes require explicit approval:

```sh
npm start -- roles add --guild <guild-id> --user <user-id> --role <role-id> --yes --json
npm start -- roles remove --guild <guild-id> --user <user-id> --role <role-id> --yes --json
npm start -- roles create --guild <guild-id> --name "Helper" --yes --json
npm start -- roles update --guild <guild-id> --role <role-id> --name "Helper" --yes --json
npm start -- roles delete --guild <guild-id> --role <role-id> --yes --json
```

Moderation operations also require explicit approval:

Moderation also rejects bot, owner, self, and targets at or above the bot’s role hierarchy.

```sh
npm start -- moderation timeout --guild <guild-id> --user <user-id> --duration 3600000 --reason "reason" --yes --json
npm start -- moderation kick --guild <guild-id> --user <user-id> --reason "reason" --yes --json
npm start -- moderation ban --guild <guild-id> --user <user-id> --reason "reason" --yes --json
```

Preview or send a message. Writes require explicit approval:

```sh
npm start -- messages send --channel <channel-id> --content "Hello" --dry-run --json
npm start -- messages send --channel <channel-id> --content "Hello" --yes --json
```

Create a test channel with the configured test guild:

```sh
npm start -- channels create --guild "$TEST_GUILD" --name discript-test --dry-run --json
npm start -- channels create --guild "$TEST_GUILD" --name discript-test --yes --json
```

Direct dry-runs validate command-specific required fields and return a structured preview without connecting to Discord:

```sh
npm start -- channels create --guild <guild-id> --name preview --dry-run --json
```

Add `--validate` to connect, resolve the target, and check permissions while still preventing the mutation:

```sh
npm start -- channels create --guild <guild-id> --name preview --dry-run --validate --json
```

Messages can be read or changed with explicit approval for writes:

```sh
npm start -- messages get --channel <channel-id> --message <message-id> --json
npm start -- messages edit --channel <channel-id> --message <message-id> --content "Updated" --yes --json
npm start -- messages delete --channel <channel-id> --message <message-id> --yes --json
npm start -- messages react --channel <channel-id> --message <message-id> --emoji "👍" --yes --json
npm start -- messages pin --channel <channel-id> --message <message-id> --yes --json
npm start -- messages unpin --channel <channel-id> --message <message-id> --yes --json
npm start -- messages bulk-delete --channel <channel-id> --messages <id1,id2> --yes --json
```

Evaluate source inline:

```sh
npm start -- --eval 'guilds = discord.guilds.list(); guilds' --json
```

Finite commands can be bounded for automation:

```sh
npm start -- --timeout 15000 --eval 'discord.guilds.list()' --json
```

Read source from standard input:

```sh
printf '%s\n' 'discord.guilds.list()' | npm start -- --json
```

For agent pipelines and long-running scripts, use JSONL output:

```sh
npm start -- --eval 'print({phase: "start"}); discord.guilds.list()' --output jsonl
```

Run a script file:

```sh
npm start -- examples/list-guilds.ds --json
```

The current language slice supports literals, variables, property access, function calls, and sequential statements. The CLI and language runtime use the same Discord capability layer.

## Development

```sh
npm test
npm run lint
```

The tests are deterministic where possible and do not require a Discord connection. Live smoke commands require a configured `DISCORD_TOKEN`.

## Security

Never commit `.env`, bot tokens, credential-bearing URLs, or raw Discord payloads containing sensitive data. Mutating operations will require explicit safeguards as the capability surface expands.

## Specifications

Product and behavior requirements are maintained in [SPEC.md](SPEC.md) and [specs/](specs/).
