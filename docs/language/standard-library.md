# Standard library

Discript exposes a small safe standard library to every script:

- `length(value)` returns the length of a string, array, or object.
- `keys(object)` and `values(object)` return ordinary arrays.
- `range(end)` or `range(start, end, step)` creates a bounded numeric sequence.
- `now()` returns the current time as an ISO-8601 string.

Ranges and loops are capped at 10,000 items. Invalid inputs return structured `INVALID_ARGUMENT` errors. These helpers intentionally do not expose filesystem, shell, or arbitrary network access; Discord operations remain behind the Discord adapter.

See the [standard-library example](../../examples/fundamentals/standard-library.ds) and [language reference](reference.md).
