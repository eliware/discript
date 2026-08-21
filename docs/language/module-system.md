# Module system

Use imports to share functions and constants between `.ds` files. Existing `import "./shared.ds"` keeps the compatibility behavior of evaluating a file into the caller's scope. Explicit module imports use an alias and return exported names:

```ds
import helpers from "./helpers.ds"
print(helpers.greeting("Discord"))
```

Export functions or assignments with `export fn ...` or `export name = ...`. Keep modules small and explicit: a reusable provisioning function should accept IDs and options rather than reading hidden state. Resolve paths relative to the importing script and avoid importing secrets.

Aliased modules execute in an isolated module scope and return the same cached export object for repeated imports during one script execution. Private module variables do not leak into the caller. Legacy side-effect imports intentionally execute into the caller's scope and are not isolated; use aliased imports for new reusable modules. A failed module evaluation is removed from the cache so a later explicit retry can load it again.

Check the current import/export forms in the [language reference](reference.md) and exercise them with the [aliased import](../../examples/composition/aliased-import.ds) and [exported module](../../examples/composition/exported-module.ds) examples in the repository [examples catalog](../../examples/README.md).
