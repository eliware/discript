import 'dotenv/config';
import { log, registerHandlers, registerSignals } from '@eliware/common';
import { parseArgs } from './args.mjs';
import { helpText, VERSION } from './help.mjs';
import { readSource } from './input.mjs';
import { writeResult } from './output.mjs';
import { parse } from './parser.mjs';
import { evaluate } from './evaluator.mjs';
import { createDiscordApi } from './discord.mjs';

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
  if (options.dry_run) return { dryRun: true, source: input.source };
  const { createDiscordRuntime } = await import('./runtime.mjs');
  const runtime = await createDiscordRuntime();
  try {
    return evaluate(parse(input.source), {
      discord: createDiscordApi(runtime.client, options),
      find: (items, property, expected) => (items ?? []).find(item => item?.[property] === expected),
      filter: (items, property, expected) => (items ?? []).filter(item => item?.[property] === expected),
      print: value => { writeResult(value, options, dependencies.stdout ?? console.log); return value; },
    });
  } finally {
    await runtime.shutdown();
  }
}

async function executeDirectCommand(command, options) {
  if (options.dry_run) return { dryRun: true, command };
  const { createDiscordRuntime } = await import('./runtime.mjs');
  const runtime = await createDiscordRuntime();
  try {
    const api = createDiscordApi(runtime.client, options);
    if (command.join(' ') === 'guilds list') return api.guilds.list();
    if (command[0] === 'channels' && command[1] === 'list') {
      const guildId = options.guild;
      if (!guildId) throw Object.assign(new Error('channels list requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      return api.guilds.get(guildId).channels.list();
    }
    throw Object.assign(new Error(`Unknown command: ${command.join(' ')}`), { code: 'UNKNOWN_COMMAND', exitCode: 2 });
  } finally {
    await runtime.shutdown();
  }
}
