# Events and daemons

Register handlers with `on("messageCreate") { ... }`. Handler scripts remain connected until stopped. Use `--timeout` for bounded automation and ensure handlers do not perform unapproved mutations on every event.

For repeated agent commands, keep the Gateway connection in a shared broker instead of starting a new client for every invocation:

```sh
discript daemon start
discript --broker script.ds
discript daemon status
discript daemon stop
```

The broker endpoint is derived from a hash of the token and contains no token material. A second `daemon start` for the same token fails with `BROKER_ALREADY_RUNNING`; it does not unlink or interrupt the existing broker. Broker requests have a finite timeout, and all broker shutdown paths close the Discord client and remove the endpoint.
