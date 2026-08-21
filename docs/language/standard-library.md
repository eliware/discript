# Standard library

Discript exposes a small safe standard library to every script:

- `length(value)` returns the length of a string, array, or object.
- `keys(object)` and `values(object)` return ordinary arrays.
- `range(end)` or `range(start, end, step)` creates a bounded numeric sequence.
- `now()` returns the current time as an ISO-8601 string.
- `race(...)` resolves with the first completed promise.
- `allSettled(...)` returns the outcome of every promise.
- `mapLimit(items, limit, callback)` maps a collection with bounded concurrency while preserving order.
- `timeout(operation, milliseconds)` rejects with `OPERATION_TIMEOUT` when an operation exceeds its bound.
- `retry(callback, attempts, delay)` reruns a callback until it succeeds or the bounded attempt count is exhausted.

Ranges and loops are capped at 10,000 items. Invalid inputs return structured `INVALID_ARGUMENT` errors. These helpers intentionally do not expose filesystem, shell, or arbitrary network access; Discord operations remain behind the Discord adapter.

Use `retry` around idempotent reads or explicitly retry-safe operations. Do not blindly retry mutations. `timeout` bounds when the script stops waiting for an operation; it does not cancel an already-running underlying Discord request.

See the [standard-library example](../../examples/fundamentals/standard-library.ds) and [language reference](reference.md).
