# Production deployment

Install the published package in a controlled Node.js 26+ environment, inject a least-privilege bot token, and run read-only health checks before enabling mutations. Use a supervisor for long-running event scripts and bound them with a timeout or explicit shutdown policy.

For an MCP daemon, bind HTTP only to a trusted interface or use HTTPS with TLS files, authentication, CORS restrictions, and a reverse proxy or firewall. Do not expose `auth.mode=none` to an untrusted network. Run stdio clients under a dedicated service account with a fixed executable path. Monitor listener health, authentication failures, request duration, output-limit failures, and process exit codes.
