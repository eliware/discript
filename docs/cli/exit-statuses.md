# Exit statuses

Exit status is part of the automation contract:

| Status | Meaning |
| ---: | --- |
| `0` | Success. |
| `2` | Invalid input, missing option, or validation failure. |
| `3` | Script parse or language error. |
| `4` | Missing or invalid runtime authentication/configuration. |
| `5` | Discord API or permission failure. |
| Other | Script-defined status, such as `exit(10, "rollback")`. |

Machine-readable errors include `error`, `code`, and `exitCode`. Within a script, use status values and `exit(code, message)` to let a harness choose a next branch.

