# Runtime Lifecycle

Finite Discript programs shall shut down automatically after their work is complete.

The runtime shall remain active when a script has event listeners, timers, loops, or other ongoing work. Long-running programs shall support intentional shutdown and signal-based shutdown.
