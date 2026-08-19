# Execution model

Discript loads environment configuration, connects the Discord client, evaluates one command or script, emits results, and shuts down. Event handlers intentionally keep the process alive; use `--timeout` or a termination signal to bound them.

