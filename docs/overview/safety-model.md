# Safety model

Reads are safe by default. Mutations support previews. Destructive operations require explicit approval at the CLI or inside script options. Validation should precede application, and multi-step workflows should retain enough IDs to compensate for partial failure.

