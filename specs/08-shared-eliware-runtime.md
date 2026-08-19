# Shared Eliware Runtime

Discript should reuse `/usr/src/eliware/common` for shared application concerns where appropriate.

This includes logging, safe serialization, filesystem and path utilities, uncaught-error handling, and signal-aware shutdown. Discript-specific language parsing, runtime behavior, and Discord integration shall remain in the Discript project.
