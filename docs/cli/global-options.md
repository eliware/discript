# Global options

| Option | Meaning |
| --- | --- |
| `--json` | Emit one structured JSON result. |
| `--output jsonl` | Emit newline-delimited JSON values. |
| `--pretty` | Prefer human-readable output. |
| `--dry-run` | Preview a supported mutation without changing Discord. |
| `--validate` | With dry-run, resolve targets and validate required inputs. |
| `--yes`, `-y` | Approve a mutation. Required for guarded and destructive operations. |
| `--timeout <ms>` | Bound a script or event process lifetime. |
| `-e`, `--eval <source>` | Evaluate inline Discript source. |

Options apply to direct commands. Script code can pass `{dryRun: true}` or `{force: true}` to API methods, allowing approval to be part of the script itself.

