# Idempotency and retries

Prefer lookup-or-create patterns, deterministic names, and recorded IDs. A retry after a timeout may have succeeded remotely; inventory first instead of blindly repeating a mutation.

