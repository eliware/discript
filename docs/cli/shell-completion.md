# Shell completion

Generate completion code for the shell you use:

```sh
discript completion bash > ~/.local/share/discript-completion.bash
discript completion zsh > ~/.zfunc/_discript
discript completion fish > ~/.config/fish/completions/discript.fish
```

Load the Bash output from your shell profile or place Zsh/Fish output in the shell’s completion directory. Review generated code before installing it into a shared profile. Completion covers the command catalog, not dynamic Discord IDs or names.

Use `discript commands list --json` when an agent needs authoritative command discovery rather than shell completion.

