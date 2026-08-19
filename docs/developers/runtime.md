# Runtime

Runtime code owns environment loading, Discord client creation, script evaluation, built-ins, output, and shutdown. Keep connection lifecycle deterministic: every finite invocation should destroy the client even when evaluation fails.

