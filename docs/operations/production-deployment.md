# Production deployment

Install the published package in a controlled Node.js 26+ environment, inject a least-privilege token, and run read-only health checks before enabling mutations. Use a supervisor for long-running event scripts and bound them with a timeout or explicit shutdown policy.

For MCP, use a trusted interface or HTTPS with TLS, authentication, CORS restrictions, and firewall controls; never expose unauthenticated HTTP to an untrusted network. Pin versions, isolate service credentials, test startup/read-only/dry-run/approval/reconnect/shutdown, and keep a rollback procedure.
