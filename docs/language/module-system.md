# Module system

Use imports to share functions and constants between `.ds` files. Keep modules small and explicit: a reusable provisioning function should accept IDs and options rather than reading hidden state. Resolve paths relative to the calling script and avoid importing secrets.

Check the current import/export forms in the [language reference](reference.md) and exercise them with the composition examples in the repository [examples catalog](../../examples/README.md).
