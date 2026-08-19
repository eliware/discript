# Runtime lifecycle and concurrency

Every finite Discript invocation follows this lifecycle:

1. Load `.env` and the process environment.
2. Select a direct command, file, inline source, or stdin source.
3. Connect the Discord client for script execution.
4. Parse and evaluate the program.
5. Emit `print()` and final results using the selected output mode.
6. Clear timers and destroy the Discord client.
7. Return the script or runtime exit status.

Shutdown occurs from a `finally` path, including when parsing, evaluation, a Discord request, or a timer callback fails.

## Sequential operations

Statements are evaluated in order. A later statement can use a value returned by an earlier operation:

```text
guild = discord.guilds.get(env.TEST_GUILD)
channels = guild.channels.list()
print({guildId: guild.id, channelCount: channels.length})
```

Keep dependent mutations sequential. The Discord adapter may still perform asynchronous network work behind each method; the script sees the completed result before the next dependent statement runs.

## `await`

The language accepts `await` for an expression that produces a promise-like value:

```text
result = await discord.guilds.list()
print(result)
```

Most examples can omit `await` because the evaluator awaits function arguments and statement results at the runtime boundary. Use it when making asynchronous intent explicit in generated scripts.

## Parallel work

`parallel()` starts independent operations together and returns an array of results:

```text
results = parallel(
  discord.guilds.list(),
  discord.bot.get()
)
print(results)
```

Only parallelize independent work. Do not parallelize mutations that depend on ordering, share a target resource, or could exceed Discord rate limits. If one operation rejects, the combined result rejects and normal cleanup still runs.

## Collection helpers

The runtime provides async helpers for agent-friendly collection processing:

```text
names = map(channels, item => item.name)
visible = filter(channels, "type", 0)
total = reduce(numbers, (sum, item) => sum + item, 0)
```

`map()` and `filter()` may evaluate callbacks asynchronously. `reduce()` processes items in order so each accumulator value is available to the next callback.

## Delays and timers

`sleep(milliseconds)` waits within the current operation. `after()` registers a one-shot callback; `every()` registers a repeating callback:

```text
after(5000, () => print({event: "reminder"}))
every(60000, () => print({event: "heartbeat"}))
```

Timer delays must be positive integer milliseconds. Timers are cleared during shutdown. A timer registration counts as a long-running handler, so the process remains alive until stopped or timed out.

Timer callbacks are invoked asynchronously. Keep callbacks short, catch expected failures, and avoid overlapping mutations from a fast interval.

## Event handlers

Register a Discord client event with `on(eventName, handler)`. The handler receives the Discord event payload as its argument and the same payload is exposed as the `event` script variable:

```text
on("messageCreate") {
  if (event.author.bot != true) {
    print({author: event.author, content: event.content})
  }
}
```

Registering an event handler keeps the runtime alive. Multiple handlers can be registered. Handlers should be idempotent or use their own deduplication if Discord can deliver a repeated event.

## Timeouts and stopping

Bound any event or timer script used by automation:

```sh
discript monitor.ds --timeout 30000 --output jsonl
```

An expired timeout returns `EXECUTION_TIMEOUT` with process status `6`. A normal termination signal also enters cleanup. The runtime does not expose a script-level timer cancellation API yet; design repeating scripts around a bounded process or external stop signal.

## Errors in concurrent work

Use `try { ... } catch (error) { ... }` for an expected operation failure and inspect the normalized error object. Do not swallow approval, permission, or authentication failures without returning a meaningful status to the caller.

```text
result = try {
  discord.channels.get(env.HEALTH_CHANNEL).send("probe", {dryRun: true})
} catch (error) {
  print({ok: false, error: error})
}
```

An unexpected error stops evaluation; registered timers are cleared and the Discord client is shut down before the CLI reports the error.
