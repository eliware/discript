# Audit and observability

Agent workflows should leave a compact, reviewable record of what was requested, inspected, and changed. Prefer structured output over scraping human-readable text.

Capture request ID, command or script mode, target IDs, preview/applied mode, exit code, duration, and final action. Never record tokens, authorization headers, TLS key material, or unnecessary message content.

For MCP calls preserve `requestId`, `ok`, `exitCode`, `warnings`, and `diagnostics`. For CLI calls preserve stdout and stderr separately and treat the process exit code as authoritative.

```ds
guild = discord.guilds.get(env.TEST_GUILD)
print({operation: "inventory", guildId: guild.id, status: "complete"})
```

See [sanitized-output.ds](../../examples/agents/sanitized-output.ds) and [result-envelope.ds](../../examples/agents/result-envelope.ds). Monitor authentication, permission, timeout, queue, approval, Gateway-limit, and shutdown failures.

