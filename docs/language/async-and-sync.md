# Async and synchronous operations

Discord requests are asynchronous at the runtime boundary. Discript scripts can write operations sequentially and use the returned value in later expressions:

```text
channel = discord.guilds.get(env.TEST_GUILD).channels.create("ops", {dryRun: true})
print(channel.id)
```

The language also supports callbacks, event handlers, and parallel workflows. Keep dependent mutations sequential; parallelize independent read-only work only when ordering and rate limits are understood. A script with event handlers remains alive until shutdown or timeout.

