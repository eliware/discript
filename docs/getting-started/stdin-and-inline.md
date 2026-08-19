# Stdin and inline scripts

Use `discript -e 'print(1)'` for a short expression or pipe source with `cat script.ds | discript --json`. Stdin is useful when a harness generates a temporary plan and should not persist source text.

