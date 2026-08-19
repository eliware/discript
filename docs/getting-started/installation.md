# Installation

Discript requires Node.js 26 or newer and a Discord bot token. From a checkout:

```sh
npm install
cp .env.example .env
npm start -- guilds list --json
```

The published package is `@eliware/discript`:

```sh
npm install -g @eliware/discript
discript guilds list --json
```

The bot must be able to see the guilds it will target. Mutating workflows additionally require the corresponding Discord permissions.

