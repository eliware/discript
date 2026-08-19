# Discord Scripting Language

Discript shall be a scripting language designed specifically for programmatic interaction with Discord.

The language should remain small and approachable while exposing Discord functionality through a standard library and object model.

The core language contract includes:

- assignments, literals, arrays, objects, member access, and function calls;
- reusable `fn` declarations, `return`, imports, and callback expressions;
- `if`/`else`, bounded `while`, and bounded `for (... in ...)` blocks;
- arithmetic, comparison, logical, unary, and grouped expressions with predictable precedence;
- `on`, `every`, and `after` declarations for runtime integrations;
- `//` and `#` line comments so generated scripts can explain intent.

Discord operations are exposed as ordinary values and functions. The language runtime remains responsible for parsing, evaluation, scope, errors, and control flow; the Discord capability layer remains responsible for API calls and safety policy.
