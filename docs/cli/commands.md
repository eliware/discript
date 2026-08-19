# CLI command reference

The canonical command list is available at runtime with `discript commands list --json`. Unless stated otherwise, use `--json` for automation and `--pretty` for human output. IDs are strings. Mutating commands support `--dry-run`; guarded and destructive commands require `--yes` or `-y` to apply.

## Global forms

```sh
discript <resource> <operation> [options]
discript <script-file> [options]
discript -e '<source>' [options]
cat script.ds | discript [options]
```

Direct commands connect, execute once, emit a result, and shut down. See [global options](global-options.md) for shared flags.

## Identity and guilds

```sh
discript bot get
discript guilds list
discript guilds get --guild <guild-id>
```

Guild creation and deletion are not supported because they are not appropriate bot operations.

## Members, roles, and moderation

```sh
discript members list --guild <guild-id>
discript members get --guild <guild-id> --user <user-id>
discript roles list --guild <guild-id>
discript roles get --guild <guild-id> --role <role-id>
discript roles create --guild <guild-id> --name <name> --yes
discript roles update --guild <guild-id> --role <role-id> --name <name> --yes
discript roles delete --guild <guild-id> --role <role-id> --yes
discript roles add --guild <guild-id> --user <user-id> --role <role-id> --yes
discript roles remove --guild <guild-id> --user <user-id> --role <role-id> --yes
discript moderation ban --guild <guild-id> --user <user-id> --yes
discript moderation kick --guild <guild-id> --user <user-id> --yes
discript moderation timeout --guild <guild-id> --user <user-id> --duration <milliseconds> --yes
```

Member “deletion” is represented by kick or ban. Managed roles and the everyone role cannot be treated as ordinary deletable roles.

## Channels and voice

```sh
discript channels list --guild <guild-id>
discript channels get --channel <channel-id>
discript channels create --guild <guild-id> --name <name> --type text --yes
discript channels create --guild <guild-id> --name <name> --type voice --category <category-id> --yes
discript channels create --guild <guild-id> --name <name> --type category --yes
discript channels update --channel <channel-id> --name <name> --yes
discript channels update --channel <channel-id> --category <category-id> --position <number> --yes
discript channels update --channel <channel-id> --uncategorized --yes
discript channels delete --channel <channel-id> --yes
discript voice status --guild <guild-id>
discript voice join --channel <voice-channel-id> --yes
discript voice leave --guild <guild-id> --yes
```

`--category`/`--parent` assigns a parent category; `--uncategorized` removes it. Voice-user controls are:

```sh
discript voice-users status --guild <guild-id> --user <user-id>
discript voice-users mute --guild <guild-id> --user <user-id> --yes
discript voice-users unmute --guild <guild-id> --user <user-id> --yes
discript voice-users deafen --guild <guild-id> --user <user-id> --yes
discript voice-users undeafen --guild <guild-id> --user <user-id> --yes
discript voice-users move --guild <guild-id> --user <user-id> --channel <voice-channel-id> --yes
discript voice-users disconnect --guild <guild-id> --user <user-id> --yes
```

## Messages and threads

```sh
discript messages send --channel <channel-id> --content <text>
discript messages list --channel <channel-id> --limit <number>
discript messages get --channel <channel-id> --message <message-id>
discript messages edit --channel <channel-id> --message <message-id> --content <text> --yes
discript messages delete --channel <channel-id> --message <message-id> --yes
discript messages react --channel <channel-id> --message <message-id> --emoji <emoji> --yes
discript messages pin --channel <channel-id> --message <message-id> --yes
discript messages unpin --channel <channel-id> --message <message-id> --yes
discript messages bulk-delete --channel <channel-id> --messages <id,id,...> --yes
discript threads list --channel <channel-id>
discript threads create --channel <channel-id> --name <name> --yes
discript threads update --channel <channel-id> --thread <thread-id> --name <name> --yes
discript threads delete --channel <channel-id> --thread <thread-id> --yes
discript threads archive --channel <channel-id> --thread <thread-id> --yes
```

Message deletion and bulk deletion are destructive. Thread creation, archiving, and deletion are guarded mutations.

## Permissions and webhooks

```sh
discript permissions list --channel <channel-id>
discript permissions set --channel <channel-id> --target <role-or-user-id> --allow ViewChannel,SendMessages --deny ManageMessages --yes
discript permissions delete --channel <channel-id> --target <role-or-user-id> --yes
discript webhooks list --channel <channel-id>
discript webhooks create --channel <channel-id> --name <name> --yes
discript webhooks update --channel <channel-id> --webhook <webhook-id> --name <name> --yes
discript webhooks delete --channel <channel-id> --webhook <webhook-id> --yes
```

Permission `--allow` and `--deny` values are comma-separated Discord permission names. Webhook secrets must not be printed or committed.

## Invites, events, emojis, and stickers

```sh
discript invites list --guild <guild-id>
discript invites create --guild <guild-id> --channel <channel-id> --duration <seconds> --yes
discript invites delete --guild <guild-id> --invite <code> --yes
discript events list --guild <guild-id>
discript events create --guild <guild-id> --name <name> --start <ISO-8601> --yes
discript events update --guild <guild-id> --event <event-id> --name <name> --yes
discript events delete --guild <guild-id> --event <event-id> --yes
discript emojis list --guild <guild-id>
discript emojis get --guild <guild-id> --emoji <emoji-id>
discript emojis create --guild <guild-id> --name <name> --file <path> --yes
discript emojis update --guild <guild-id> --emoji <emoji-id> --name <name> --yes
discript emojis delete --guild <guild-id> --emoji <emoji-id> --yes
discript stickers list --guild <guild-id>
discript stickers get --guild <guild-id> --sticker <sticker-id>
discript stickers create --guild <guild-id> --name <name> --file <path> --tags <tags> --yes
discript stickers update --guild <guild-id> --sticker <sticker-id> --name <name> --yes
discript stickers delete --guild <guild-id> --sticker <sticker-id> --yes
```

Emoji creation requires `--name` and `--file`. Sticker creation requires `--name`, `--file`, and `--tags`.

## Aliases and completion

Resource aliases include `guild`, `member`, `role`, `chan`/`channel`, `msg`/`message`, `event`, `invite`, and `emoji`. Full names are preferred in durable automation. Generate completion with `discript completion bash`, `discript completion zsh`, or `discript completion fish`.

## Safety example

```sh
discript channels create --guild "$TEST_GUILD" --name staging --dry-run --validate --json
discript channels create --guild "$TEST_GUILD" --name staging --yes --json
```

The script API has equivalent internal controls: `{dryRun: true}` and `{force: true}`. See [safety](../user-guide/safety.md) and [exit statuses](exit-statuses.md).
