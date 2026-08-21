# Language reference

This is the concise normative reference for the implemented language. The parser in `src/parser/` remains authoritative when syntax and prose disagree.

## Program shape

A program is a sequence of statements. Blocks use `{` and `}`; statements may be separated by newlines or semicolons; control-flow bodies are blocks.

```text
name = "discript"
if (name == "discript") {
  print(name)
}
```

## Values and operators

Values include `null`, booleans, numbers, strings, arrays, objects, functions, and normalized Discord results. Discord snowflake IDs are strings.

From lowest to highest precedence: `||`; `&&`; `==` and `!=`; `<`, `<=`, `>`, `>=`; `+` and `-`; `*` and `/`; unary `!` and `-`; then member access `.`, indexes `[]`, and calls `()`. Indexes may contain any expression and can be used for arrays or computed object properties.

```text
settings = {name: "general", position: 0}
names = ["rules", "welcome", "general"]
settings["name"] = names[0]
```

## Variables and functions

Assignment binds or updates a variable. Functions use `fn name(parameters) { ... }`; `return` exits with any value.

```text
fn preview(name) {
  return {name: name, dryRun: true}
}
print(preview("staging"))
```

## Control flow

```text
if (condition) {
  print("yes")
} else {
  print("no")
}
for (item in items) {
  print(item)
}
while (condition) {
  // update condition inside the block
}
```

## Events and async values

Discord methods return values that can be assigned and passed to later operations. Keep dependent operations in order. Event callbacks use `on("eventName") { ... }`; the current payload is available as `event` and keeps the process alive until shutdown or `--timeout`.

```text
on("messageCreate") {
  print({author: event.author, content: event.content})
}
```

## Environment and runtime helpers

```text
guildId = env.TEST_GUILD
tokenMode = env.get("DISCRIPT_MODE")
env.set("DISCRIPT_LAST_RUN", "agent")
env.clear("DISCRIPT_LAST_RUN")
```

Built-ins are `print(value)`, `exit(code, message)`, `env`, and the `discord` API root. Environment values are strings or absent/null-like values.

## Operation options and errors

Mutating methods accept options where supported:

```text
guild.channels.create("preview", {type: "text", dryRun: true})
guild.roles.create("Moderator", {force: true})
```

`dryRun: true` previews without changing Discord. `force: true` approves script-level guarded operations. Use `exit(2, "message")` for intentional invalid input; unexpected errors should propagate to the CLI so it can emit its stable code and process status.
