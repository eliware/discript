# Monitoring

Use a bounded, read-only health script to verify authentication, guild visibility, and channel access. Monitor exit status, structured error codes, connection lifetime, rate limits, and API failures.

For daemons, monitor the local socket and every MCP listener, including TLS handshakes and authentication failures. Track request duration, active sessions, reconnects, rejected approvals, output truncation, and clean shutdowns. A connected client does not prove every operation is authorized.
