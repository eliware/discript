import 'dotenv/config';
import { log, registerHandlers, registerSignals } from '@eliware/common';
import { parseArgs } from './args.mjs';
import { helpText, VERSION } from './help.mjs';
import { readSource } from './input.mjs';
import { writeResult } from './output.mjs';

export async function run(argv = [], dependencies = {}) {
  const { stdout = console.log, stdin = process.stdin } = dependencies;
  const { positionals, options } = parseArgs(argv);
  if (options.help) return stdout(helpText());
  if (options.version) return stdout(VERSION);

  const source = await readSource(positionals, options, stdin);
  const errors = registerHandlers({ log });
  let shutdownHook;
  try {
    shutdownHook = registerSignals({ log, shutdownHook: async () => {} });
    const result = await executeInput(source, options, dependencies);
    if (result !== undefined) writeResult(result, options, stdout);
    return result;
  } finally {
    await shutdownHook?.shutdown?.();
    errors.removeHandlers();
  }
}

async function executeInput(input, options, dependencies) {
  if (input.kind === 'command') return executeDirectCommand(input.command, options, dependencies);
  throw Object.assign(new Error(`Script execution is not implemented yet (${input.origin}).`), {
    code: 'SCRIPT_RUNTIME_UNAVAILABLE',
    exitCode: 1,
  });
}

async function executeDirectCommand(command, options) {
  if (options.dry_run) return { dryRun: true, command };
  if (command.join(' ') !== 'guilds list') {
    throw Object.assign(new Error(`Unknown command: ${command.join(' ')}`), { code: 'UNKNOWN_COMMAND', exitCode: 2 });
  }
  const { createDiscordRuntime } = await import('./runtime.mjs');
  const runtime = await createDiscordRuntime();
  try {
    return runtime.client.guilds.cache.map(guild => ({ id: guild.id, name: guild.name }));
  } finally {
    await runtime.shutdown();
  }
}
