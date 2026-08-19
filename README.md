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

Preview or send a message. Writes require explicit approval:

```sh
npm start -- messages send --channel <channel-id> --content "Hello" --dry-run --json
npm start -- messages send --channel <channel-id> --content "Hello" --yes --json
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
