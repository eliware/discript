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
  validateTimeout(options.timeout);
  const errors = registerHandlers({ log });
  let shutdownHook;
  try {
    shutdownHook = registerSignals({ log, shutdownHook: async () => {} });
    const result = await withTimeout(executeInput(source, options, dependencies), options.timeout);
    if (result !== undefined) writeResult(result, options, stdout);
    return result;
  } finally {
    await shutdownHook?.shutdown?.();
    errors.removeHandlers();
  }
}

async function withTimeout(promise, timeout) {
  if (timeout === undefined) return promise;
  const timeoutMs = validateTimeout(timeout);
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(Object.assign(new Error(`Execution exceeded ${timeoutMs}ms.`), { code: 'EXECUTION_TIMEOUT', exitCode: 6 })), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function validateTimeout(timeout) {
  if (timeout === undefined) return undefined;
  const timeoutMs = Number(timeout);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) {
    throw Object.assign(new Error('--timeout must be a positive integer in milliseconds.'), { code: 'INVALID_TIMEOUT', exitCode: 2 });
  }
  return timeoutMs;
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
  if (options.dry_run) {
    if (command[0] === 'messages' && command[1] === 'send') {
      if (!options.channel) throw Object.assign(new Error('messages send requires --channel <id>.'), { code: 'CHANNEL_REQUIRED', exitCode: 2 });
      if (options.content === undefined) throw Object.assign(new Error('messages send requires --content <text>.'), { code: 'CONTENT_REQUIRED', exitCode: 2 });
      return { dryRun: true, action: 'messages.send', channelId: options.channel, content: options.content };
    }
    return { dryRun: true, command };
  }
  const { createDiscordRuntime } = await import('./runtime.mjs');
  const runtime = await createDiscordRuntime();
  try {
    const api = createDiscordApi(runtime.client, options);
    if (command.join(' ') === 'guilds list') return api.guilds.list();
    if (command[0] === 'guilds' && command[1] === 'get') {
      if (!options.guild) throw Object.assign(new Error('guilds get requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      const guild = api.guilds.get(options.guild);
      return { id: guild.id, name: guild.name };
    }
    if (command[0] === 'channels' && command[1] === 'list') {
      const guildId = options.guild;
      if (!guildId) throw Object.assign(new Error('channels list requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      return api.guilds.get(guildId).channels.list();
    }
    if (command[0] === 'channels' && command[1] === 'get') {
      if (!options.channel) throw Object.assign(new Error('channels get requires --channel <id>.'), { code: 'CHANNEL_REQUIRED', exitCode: 2 });
      const channel = api.channels.get(options.channel);
      return { id: channel.id, name: channel.name, type: channel.type };
    }
    if (command[0] === 'messages' && command[1] === 'send') {
      if (!options.channel) throw Object.assign(new Error('messages send requires --channel <id>.'), { code: 'CHANNEL_REQUIRED', exitCode: 2 });
      if (options.content === undefined) throw Object.assign(new Error('messages send requires --content <text>.'), { code: 'CONTENT_REQUIRED', exitCode: 2 });
      return api.channels.get(options.channel).send(options.content);
    }
    throw Object.assign(new Error(`Unknown command: ${command.join(' ')}`), { code: 'UNKNOWN_COMMAND', exitCode: 2 });
  } finally {
    await runtime.shutdown();
  }
}
