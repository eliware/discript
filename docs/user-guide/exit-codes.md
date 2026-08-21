# Exit codes

The CLI returns the Discript engine's final status as its process exit code. Scripts can call `exit(code, message)` intentionally, assign results, and branch on validation outcomes before choosing whether to continue or stop.

Use `0` for success and non-zero codes for failure or an intentional decision. In JSON mode, consume the structured status and still check the process code. See [CLI statuses](../cli/exit-statuses.md) and [language errors](../language/errors-and-status.md).
