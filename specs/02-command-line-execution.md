# Command-Line Execution

Discript shall support one-shot command-line execution.

For a one-shot command, the tool shall start, connect to Discord, execute the command, present its result, shut down, and exit.

The process shall return the command's exit status. Mutating commands shall support `--dry-run`; destructive commands shall require `--yes` or `-y` unless they are only being previewed.
