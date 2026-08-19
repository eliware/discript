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

## Usage

List guilds with a direct CLI command:

```sh
npm start -- guilds list --json
```

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

Messages can be read or changed with explicit approval for writes:

```sh
npm start -- messages get --channel <channel-id> --message <message-id> --json
npm start -- messages edit --channel <channel-id> --message <message-id> --content "Updated" --yes --json
npm start -- messages delete --channel <channel-id> --message <message-id> --yes --json
npm start -- messages react --channel <channel-id> --message <message-id> --emoji "👍" --yes --json
npm start -- messages pin --channel <channel-id> --message <message-id> --yes --json
npm start -- messages unpin --channel <channel-id> --message <message-id> --yes --json
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
