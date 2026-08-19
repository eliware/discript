# Architecture

The execution path is:

`bin/discript.mjs` → CLI/input selection → parser or direct-command handler → runtime/API adapters → Discord.js → normalized output.

The parser should know language structure, not Discord behavior. CLI handlers should validate command shape, not duplicate Discord.js implementation. Discord adapters own API calls, safety options, and normalization. Runtime owns connection and shutdown. This separation keeps direct commands and `.ds` scripts on the same capability surface.

