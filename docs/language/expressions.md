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
