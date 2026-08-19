# Events and handlers

An `on(name) { ... }` handler receives the current event payload as `event`. Handlers are long-lived and should be treated like daemons: constrain scope, handle errors, and make mutation approval explicit.

