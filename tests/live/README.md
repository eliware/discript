# Live Discord tests

Live tests are intentionally excluded from the default test command. Run them only with a configured bot token and `TEST_GUILD`:

```sh
DISCRIPT_LIVE=1 npm run test:live
```

The live suite is scoped to `TEST_GUILD`. Mutation tests require the separate `DISCRIPT_LIVE_MUTATIONS=1` opt-in and must clean up resources they create.
