# Expressions

Expressions produce values: literals, identifiers, arrays, objects, function calls, member access, indexes, unary operators, binary operators, and awaited Discord results. Calls can be nested and their results can be assigned for later commands.

Use dot access for known properties and brackets for computed properties or array positions:

```ds
channels = [{name: "general"}, {name: "alerts"}]
property = "name"
channels[0][property] = "welcome"
print(channels[0].name)
```

Member and index expressions can be assignment targets. Assigning through `null` is an error. Operator precedence and the implemented forms are defined in the [language reference](reference.md). Prefer parentheses in agent-generated conditions and use `for` to iterate collections.

Conditional expressions evaluate only the selected branch. Optional member, index, and call access returns an absent value instead of raising when its receiver is null:

```ds
channel = discord.guilds.get(env.TEST_GUILD)?.channels?.get(env.CHANNEL_ID)
label = channel?.name ?? "missing"
kind = channel == null ? "not-found" : channel.type
```

Use ordinary access when absence should be treated as an error. See the [optional access example](../../examples/fundamentals/optional-and-conditional.ds).

Array and object spread compose values without mutating the source:

```ds
base = ["general", "rules"]
channels = [...base, "alerts"]
defaults = {dryRun: true, type: "text"}
voicePlan = {...defaults, type: "voice"}
```

Later object properties override earlier spread properties. Array spread requires an iterable; object spread requires an object.

Array and object patterns can unpack results:

```ds
{name, type, ...metadata} = channel
[first, second, ...remaining] = values
```

Object patterns select named properties; array patterns select positions. Rest captures unconsumed values or properties. The source must be compatible with the pattern.
