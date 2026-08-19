# First script

Create `inventory.ds`:

```text
guildId = env.TEST_GUILD
guild = discord.guilds.get(guildId)
channels = guild.channels.list()
print({guild: guild.name, channels: channels})
```

Run it with `discript inventory.ds --json`. Scripts may be stored files, passed with `-e`, or piped on standard input.

