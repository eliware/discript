# Adding a Discord resource

1. Add the adapter module under `src/discord/`.
2. Normalize Discord.js values into stable JSON-friendly objects.
3. Expose the resource from the API root and guild/channel scope that owns it.
4. Add command catalog entries, argument validation, and a handler if CLI access is required.
5. Classify reads, mutations, and destructive operations in the safety layer.
6. Add 1:1 unit tests and live tests only when the operation is safe to isolate.
7. Update `docs/discord/crud-matrix.md`, examples, specs, and README only for user-visible behavior.

