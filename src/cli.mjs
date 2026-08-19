import 'dotenv/config';
import { log, registerHandlers, registerSignals } from '@eliware/common';
import { parseArgs } from './args.mjs';
import { helpText, VERSION } from './help.mjs';
import { readSource } from './input.mjs';
import { writeResult } from './output.mjs';
import { parse } from './parser.mjs';
import { evaluate, ScriptExit } from './evaluator.mjs';
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
    shutdownHook = registerSignals({ log, exit: false, shutdownHook: async () => {} });
    const result = await withTimeout(executeInput(source, options, dependencies), options.timeout);
    if (result !== undefined) writeResult(result, options, stdout);
    return result;
  } finally {
    await shutdownHook?.shutdown?.();
    shutdownHook?.removeHandlers?.();
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
    const result = await evaluate(parse(input.source), {
      discord: createDiscordApi(runtime.client, options),
      find: (items, property, expected) => (items ?? []).find(item => item?.[property] === expected),
      filter: (items, property, expected) => (items ?? []).filter(item => item?.[property] === expected),
      exit: (exitCode = 0, message = null) => { throw new ScriptExit(exitCode, message); },
      print: value => { writeResult(value, options, dependencies.stdout ?? console.log); return value; },
    });
    return result;
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
    if (command[0] === 'members' && command[1] === 'list') {
      if (!options.guild) throw Object.assign(new Error('members list requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      return api.guilds.get(options.guild).members.list();
    }
    if (command[0] === 'members' && command[1] === 'get') {
      if (!options.guild) throw Object.assign(new Error('members get requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      if (!options.user) throw Object.assign(new Error('members get requires --user <id>.'), { code: 'USER_REQUIRED', exitCode: 2 });
      return api.guilds.get(options.guild).members.get(options.user);
    }
    if (command[0] === 'roles' && command[1] === 'list') {
      if (!options.guild) throw Object.assign(new Error('roles list requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      return api.guilds.get(options.guild).roles.list();
    }
    if (command[0] === 'roles' && command[1] === 'get') {
      if (!options.guild) throw Object.assign(new Error('roles get requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      if (!options.role) throw Object.assign(new Error('roles get requires --role <id>.'), { code: 'ROLE_REQUIRED', exitCode: 2 });
      return api.guilds.get(options.guild).roles.get(options.role);
    }
    if (command[0] === 'roles' && command[1] === 'create') {
      if (!options.guild) throw Object.assign(new Error('roles create requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      if (!options.name) throw Object.assign(new Error('roles create requires --name <name>.'), { code: 'NAME_REQUIRED', exitCode: 2 });
      return api.guilds.get(options.guild).roles.create(options.name);
    }
    if (command[0] === 'roles' && (command[1] === 'update' || command[1] === 'delete')) {
      if (!options.guild) throw Object.assign(new Error(`roles ${command[1]} requires --guild <id>.`), { code: 'GUILD_REQUIRED', exitCode: 2 });
      if (!options.role) throw Object.assign(new Error(`roles ${command[1]} requires --role <id>.`), { code: 'ROLE_REQUIRED', exitCode: 2 });
      const role = api.guilds.get(options.guild).roles.get(options.role);
      if (command[1] === 'delete') return role.delete();
      if (!options.name) throw Object.assign(new Error('roles update requires --name <name>.'), { code: 'NAME_REQUIRED', exitCode: 2 });
      return role.update({ name: options.name });
    }
    if (command[0] === 'roles' && (command[1] === 'add' || command[1] === 'remove')) {
      if (!options.guild) throw Object.assign(new Error(`roles ${command[1]} requires --guild <id>.`), { code: 'GUILD_REQUIRED', exitCode: 2 });
      if (!options.user) throw Object.assign(new Error(`roles ${command[1]} requires --user <id>.`), { code: 'USER_REQUIRED', exitCode: 2 });
      if (!options.role) throw Object.assign(new Error(`roles ${command[1]} requires --role <id>.`), { code: 'ROLE_REQUIRED', exitCode: 2 });
      const member = api.guilds.get(options.guild).members.get(options.user);
      return command[1] === 'add' ? member.addRole(options.role) : member.removeRole(options.role);
    }
    if (command[0] === 'moderation' && ['ban', 'kick', 'timeout'].includes(command[1])) {
      if (!options.guild) throw Object.assign(new Error(`moderation ${command[1]} requires --guild <id>.`), { code: 'GUILD_REQUIRED', exitCode: 2 });
      if (!options.user) throw Object.assign(new Error(`moderation ${command[1]} requires --user <id>.`), { code: 'USER_REQUIRED', exitCode: 2 });
      const member = api.guilds.get(options.guild).members.get(options.user);
      if (command[1] === 'timeout') {
        if (options.duration === undefined) throw Object.assign(new Error('moderation timeout requires --duration <milliseconds>.'), { code: 'DURATION_REQUIRED', exitCode: 2 });
        return member.timeout(options.duration, options.reason);
      }
      return member[command[1]](options.reason);
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
    if (command[0] === 'channels' && command[1] === 'create') {
      if (!options.guild) throw Object.assign(new Error('channels create requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      if (!options.name) throw Object.assign(new Error('channels create requires --name <name>.'), { code: 'NAME_REQUIRED', exitCode: 2 });
      return api.guilds.get(options.guild).channels.create(options.name);
    }
    if (command[0] === 'channels' && command[1] === 'delete') {
      if (!options.channel) throw Object.assign(new Error('channels delete requires --channel <id>.'), { code: 'CHANNEL_REQUIRED', exitCode: 2 });
      return api.channels.get(options.channel).delete();
    }
    if (command[0] === 'threads' && command[1] === 'list') {
      if (!options.channel) throw Object.assign(new Error('threads list requires --channel <id>.'), { code: 'CHANNEL_REQUIRED', exitCode: 2 });
      return api.channels.get(options.channel).threads.list();
    }
    if (command[0] === 'threads' && command[1] === 'create') {
      if (!options.channel) throw Object.assign(new Error('threads create requires --channel <id>.'), { code: 'CHANNEL_REQUIRED', exitCode: 2 });
      if (!options.name) throw Object.assign(new Error('threads create requires --name <name>.'), { code: 'NAME_REQUIRED', exitCode: 2 });
      return api.channels.get(options.channel).threads.create(options.name);
    }
    if (command[0] === 'threads' && command[1] === 'archive') {
      if (!options.channel) throw Object.assign(new Error('threads archive requires --channel <id>.'), { code: 'CHANNEL_REQUIRED', exitCode: 2 });
      if (!options.thread) throw Object.assign(new Error('threads archive requires --thread <id>.'), { code: 'THREAD_REQUIRED', exitCode: 2 });
      return api.channels.get(options.channel).threads.archive(options.thread);
    }
    if (command[0] === 'messages' && command[1] === 'send') {
      if (!options.channel) throw Object.assign(new Error('messages send requires --channel <id>.'), { code: 'CHANNEL_REQUIRED', exitCode: 2 });
      if (options.content === undefined) throw Object.assign(new Error('messages send requires --content <text>.'), { code: 'CONTENT_REQUIRED', exitCode: 2 });
      return api.channels.get(options.channel).send(options.content);
    }
    if (command[0] === 'messages' && command[1] === 'get') {
      if (!options.channel) throw Object.assign(new Error('messages get requires --channel <id>.'), { code: 'CHANNEL_REQUIRED', exitCode: 2 });
      if (!options.message) throw Object.assign(new Error('messages get requires --message <id>.'), { code: 'MESSAGE_REQUIRED', exitCode: 2 });
      return api.messages.get(options.channel, options.message);
    }
    if (command[0] === 'messages' && command[1] === 'edit') {
      if (!options.channel) throw Object.assign(new Error('messages edit requires --channel <id>.'), { code: 'CHANNEL_REQUIRED', exitCode: 2 });
      if (!options.message) throw Object.assign(new Error('messages edit requires --message <id>.'), { code: 'MESSAGE_REQUIRED', exitCode: 2 });
      if (options.content === undefined) throw Object.assign(new Error('messages edit requires --content <text>.'), { code: 'CONTENT_REQUIRED', exitCode: 2 });
      return api.messages.edit(options.channel, options.message, options.content);
    }
    if (command[0] === 'messages' && command[1] === 'delete') {
      if (!options.channel) throw Object.assign(new Error('messages delete requires --channel <id>.'), { code: 'CHANNEL_REQUIRED', exitCode: 2 });
      if (!options.message) throw Object.assign(new Error('messages delete requires --message <id>.'), { code: 'MESSAGE_REQUIRED', exitCode: 2 });
      return api.messages.delete(options.channel, options.message);
    }
    throw Object.assign(new Error(`Unknown command: ${command.join(' ')}`), { code: 'UNKNOWN_COMMAND', exitCode: 2 });
  } finally {
    await runtime.shutdown();
  }
}
