import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { log, registerHandlers, registerSignals } from '@eliware/common';
import { parseArgs } from './args.mjs';
import { helpText, VERSION } from './help.mjs';
import { readSource } from './input.mjs';
import { writeResult } from './output.mjs';
import { parse } from './parser.mjs';
import { evaluate, ScriptExit } from './evaluator.mjs';
import { createDiscordApi } from './discord.mjs';
import { commandCatalog, completionScript, normalizeCommand, suggestCommands } from './commands.mjs';

export async function run(argv = [], dependencies = {}) {
  const { stdout = console.log, stdin = process.stdin } = dependencies;
  const { positionals, options } = parseArgs(argv);
  if (options.help) return stdout(helpText());
  if (options.version) return stdout(VERSION);

  const source = await readSource(positionals, options, stdin);
  validateTimeout(options.timeout);
  const errors = registerHandlers({ log });
  let shutdownHook;
  let activeRuntime;
  try {
    shutdownHook = registerSignals({ log, exit: false, shutdownHook: async signal => activeRuntime?.shutdown(signal) });
    const result = await withTimeout(executeInput(source, options, dependencies, runtime => { activeRuntime = runtime; }), options.timeout);
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

async function executeInput(input, options, dependencies, onRuntime = () => {}) {
  if (input.kind === 'command') return executeDirectCommand(input.command, options, dependencies);
  if (options.dry_run) return { dryRun: true, source: input.source };
  const { createDiscordRuntime } = await import('./runtime.mjs');
  const runtime = await createDiscordRuntime();
  onRuntime(runtime);
  const timers = new Set();
  try {
    let handlerCount = 0;
    const registerTimer = (delay, callback, repeating) => {
      const milliseconds = Number(delay);
      if (!Number.isInteger(milliseconds) || milliseconds < 1) throw Object.assign(new Error('Timer delay must be a positive integer in milliseconds.'), { code: 'INVALID_TIMER', exitCode: 2 });
      const timer = repeating ? setInterval(() => { void callback(); }, milliseconds) : setTimeout(() => { void callback(); }, milliseconds);
      timers.add(timer);
      return { timer: repeating ? 'interval' : 'timeout', delay: milliseconds, registered: true };
    };
    const result = await evaluate(parse(input.source), {
      discord: createDiscordApi(runtime.client, options),
      find: (items, property, expected) => (items ?? []).find(item => item?.[property] === expected),
      filter: async (items, selector, expected) => {
        if (typeof selector === 'function') {
          const values = await Promise.all((items ?? []).map(async item => [item, await selector(item)]));
          return values.filter(([, keep]) => keep).map(([item]) => item);
        }
        return (items ?? []).filter(item => item?.[selector] === expected);
      },
      exit: (exitCode = 0, message = null) => { throw new ScriptExit(exitCode, message); },
      print: value => { writeResult(value, options, dependencies.stdout ?? console.log); return value; },
      on: (eventName, handler) => {
        runtime.client.on(eventName, handler);
        handlerCount += 1;
        return { event: eventName, registered: true };
      },
      every: (delay, callback) => { handlerCount += 1; return registerTimer(delay, callback, true); },
      after: (delay, callback) => { handlerCount += 1; return registerTimer(delay, callback, false); },
      sleep: delay => new Promise(resolve => setTimeout(resolve, Number(delay))),
      parallel: (...operations) => Promise.all(operations),
      map: async (items, callback) => Promise.all((items ?? []).map(item => callback(item))),
      reduce: async (items, callback, initial) => {
        let accumulator = initial;
        for (const item of items ?? []) accumulator = await callback(accumulator, item);
        return accumulator;
      },
      importScript: async (sourcePath, sharedScope) => {
        const source = await readFile(resolve(process.cwd(), sourcePath), 'utf8');
        return evaluate(parse(source), {}, { scope: sharedScope });
      },
    });
    if (handlerCount > 0) await runtime.waitForStop();
    return result;
  } finally {
    for (const timer of timers) { clearTimeout(timer); clearInterval(timer); }
    await runtime.shutdown();
  }
}

async function executeDirectCommand(command, options) {
  command = normalizeCommand(command);
  if (command.join(' ') === 'commands list') return commandCatalog();
  if (command[0] === 'completion') return completionScript(command[1] ?? 'bash');
  if (options.dry_run) {
    const preview = previewMutation(command, options);
    if (!options.validate) return preview;
  }
  const { createDiscordRuntime } = await import('./runtime.mjs');
  const runtime = await createDiscordRuntime();
  try {
    const api = createDiscordApi(runtime.client, { ...options, dryRun: options.dry_run === true });
    if (command[0] === 'bot' && command[1] === 'get') return api.bot.get();
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
    if (command[0] === 'emojis' && command[1] === 'list') {
      if (!options.guild) throw Object.assign(new Error('emojis list requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      return api.guilds.get(options.guild).emojis.list();
    }
    if (command[0] === 'stickers' && command[1] === 'list') {
      if (!options.guild) throw Object.assign(new Error('stickers list requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      return api.guilds.get(options.guild).stickers.list();
    }
    if (command[0] === 'events' && command[1] === 'list') {
      if (!options.guild) throw Object.assign(new Error('events list requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      return api.guilds.get(options.guild).scheduledEvents.list();
    }
    if (command[0] === 'events' && command[1] === 'create') {
      if (!options.guild) throw Object.assign(new Error('events create requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      if (!options.name) throw Object.assign(new Error('events create requires --name <name>.'), { code: 'NAME_REQUIRED', exitCode: 2 });
      if (!options.start) throw Object.assign(new Error('events create requires --start <ISO-8601 time>.'), { code: 'START_REQUIRED', exitCode: 2 });
      return api.guilds.get(options.guild).scheduledEvents.create({ name: options.name, scheduledStartTime: options.start, description: options.description, entityType: options.event_type ? Number(options.event_type) : 3, entityMetadata: options.location ? { location: options.location } : undefined });
    }
    if (command[0] === 'events' && (command[1] === 'update' || command[1] === 'delete')) {
      if (!options.guild) throw Object.assign(new Error(`events ${command[1]} requires --guild <id>.`), { code: 'GUILD_REQUIRED', exitCode: 2 });
      if (!options.event) throw Object.assign(new Error(`events ${command[1]} requires --event <id>.`), { code: 'EVENT_REQUIRED', exitCode: 2 });
      const event = api.guilds.get(options.guild).scheduledEvents.get(options.event);
      if (command[1] === 'delete') return event.delete();
      if (!options.name && !options.description && !options.start) throw Object.assign(new Error('events update requires --name, --description, or --start.'), { code: 'EVENT_FIELDS_REQUIRED', exitCode: 2 });
      return event.update({ ...(options.name ? { name: options.name } : {}), ...(options.description ? { description: options.description } : {}), ...(options.start ? { scheduledStartTime: options.start } : {}) });
    }
    if (command[0] === 'voice' && command[1] === 'status') {
      if (!options.guild) throw Object.assign(new Error('voice status requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      return api.voice.status(options.guild);
    }
    if (command[0] === 'voice' && command[1] === 'join') {
      if (!options.channel) throw Object.assign(new Error('voice join requires --channel <id>.'), { code: 'CHANNEL_REQUIRED', exitCode: 2 });
      return api.voice.join(options.channel);
    }
    if (command[0] === 'voice' && command[1] === 'leave') {
      if (!options.guild) throw Object.assign(new Error('voice leave requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      return api.voice.leave(options.guild);
    }
    if (command[0] === 'invites' && command[1] === 'list') {
      if (!options.guild) throw Object.assign(new Error('invites list requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      return api.guilds.get(options.guild).invites.list();
    }
    if (command[0] === 'invites' && command[1] === 'create') {
      if (!options.guild) throw Object.assign(new Error('invites create requires --guild <id>.'), { code: 'GUILD_REQUIRED', exitCode: 2 });
      if (!options.channel) throw Object.assign(new Error('invites create requires --channel <id>.'), { code: 'CHANNEL_REQUIRED', exitCode: 2 });
      return api.guilds.get(options.guild).invites.create(options.channel, { maxAge: options.duration ? Number(options.duration) : 0, maxUses: options.messages ? Number(options.messages) : 0 });
    }
    if (command[0] === 'invites' && command[1] === 'delete') {
      if (!options.invite) throw Object.assign(new Error('invites delete requires --invite <code>.'), { code: 'INVITE_REQUIRED', exitCode: 2 });
      return api.guilds.get(options.guild ?? '').invites.delete(options.invite);
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
    if (command[0] === 'messages' && ['react', 'pin', 'unpin'].includes(command[1])) {
      if (!options.channel) throw Object.assign(new Error(`messages ${command[1]} requires --channel <id>.`), { code: 'CHANNEL_REQUIRED', exitCode: 2 });
      if (!options.message) throw Object.assign(new Error(`messages ${command[1]} requires --message <id>.`), { code: 'MESSAGE_REQUIRED', exitCode: 2 });
      if (command[1] === 'react') {
        if (!options.emoji) throw Object.assign(new Error('messages react requires --emoji <emoji>.'), { code: 'EMOJI_REQUIRED', exitCode: 2 });
        return api.messages.react(options.channel, options.message, options.emoji);
      }
      return api.messages[command[1]](options.channel, options.message);
    }
    if (command[0] === 'messages' && command[1] === 'bulk-delete') {
      if (!options.channel) throw Object.assign(new Error('messages bulk-delete requires --channel <id>.'), { code: 'CHANNEL_REQUIRED', exitCode: 2 });
      if (!options.messages) throw Object.assign(new Error('messages bulk-delete requires --messages <id,id,...>.'), { code: 'MESSAGES_REQUIRED', exitCode: 2 });
      return api.messages.bulkDelete(options.channel, options.messages);
    }
    const unknown = command.join(' ');
    const suggestions = suggestCommands(unknown);
    throw Object.assign(new Error(`Unknown command: ${unknown}${suggestions.length ? `. Did you mean: ${suggestions.join(', ')}?` : ''}`), { code: 'UNKNOWN_COMMAND', exitCode: 2, details: suggestions.length ? { suggestions } : undefined });
  } finally {
    await runtime.shutdown();
  }
}

function previewMutation(command, options) {
  const action = `${command[0]}.${command[1] ?? 'run'}`;
  const requireOption = (name, code = `${name.toUpperCase()}_REQUIRED`) => {
    if (options[name] === undefined || options[name] === '') throw Object.assign(new Error(`${action} requires --${name.replaceAll('_', '-')} <value>.`), { code, exitCode: 2 });
  };
  const requireGuild = () => requireOption('guild', 'GUILD_REQUIRED');
  const requireChannel = () => requireOption('channel', 'CHANNEL_REQUIRED');
  const requireRole = () => requireOption('role', 'ROLE_REQUIRED');
  const requireUser = () => requireOption('user', 'USER_REQUIRED');
  const requireMessage = () => requireOption('message', 'MESSAGE_REQUIRED');
  const requireEvent = () => requireOption('event', 'EVENT_REQUIRED');
  const requireMutationTarget = () => {
    if (command[0] === 'roles' && ['create', 'update', 'delete', 'add', 'remove'].includes(command[1])) requireGuild();
    if (command[0] === 'moderation') requireGuild();
    if (command[0] === 'channels' && ['create'].includes(command[1])) requireGuild();
    if (command[0] === 'invites' && command[1] === 'create') requireGuild();
    if (command[0] === 'events' && ['create', 'update', 'delete'].includes(command[1])) requireGuild();
  };
  requireMutationTarget();
  if (command[0] === 'roles' && ['add', 'remove'].includes(command[1])) { requireUser(); requireRole(); }
  if (command[0] === 'roles' && ['create', 'update'].includes(command[1])) requireOption('name', 'NAME_REQUIRED');
  if (command[0] === 'roles' && command[1] === 'delete') requireRole();
  if (command[0] === 'moderation') { requireUser(); if (command[1] === 'timeout') requireOption('duration', 'DURATION_REQUIRED'); }
  if (command[0] === 'channels' && command[1] === 'create') requireOption('name', 'NAME_REQUIRED');
  if (command[0] === 'channels' && command[1] === 'delete') requireChannel();
  if (command[0] === 'threads') { requireChannel(); if (command[1] === 'create') requireOption('name', 'NAME_REQUIRED'); if (command[1] === 'archive') requireOption('thread', 'THREAD_REQUIRED'); }
  if (command[0] === 'messages') { requireChannel(); if (['get', 'edit', 'delete', 'react', 'pin', 'unpin'].includes(command[1])) requireMessage(); if (['send', 'edit'].includes(command[1])) requireOption('content', 'CONTENT_REQUIRED'); if (command[1] === 'react') requireOption('emoji', 'EMOJI_REQUIRED'); if (command[1] === 'bulk-delete') requireOption('messages', 'MESSAGES_REQUIRED'); }
  if (command[0] === 'invites' && command[1] === 'create') requireChannel();
  if (command[0] === 'invites' && command[1] === 'delete') requireOption('invite', 'INVITE_REQUIRED');
  if (command[0] === 'events' && command[1] === 'create') { requireOption('name', 'NAME_REQUIRED'); requireOption('start', 'START_REQUIRED'); }
  if (command[0] === 'events' && command[1] === 'update') { requireEvent(); if (!options.name && !options.description && !options.start) throw Object.assign(new Error(`${action} requires --name, --description, or --start.`), { code: 'EVENT_FIELDS_REQUIRED', exitCode: 2 }); }
  if (command[0] === 'events' && command[1] === 'delete') requireEvent();
  if (command[0] === 'voice' && command[1] === 'join') requireChannel();
  if (command[0] === 'voice' && command[1] === 'leave') requireGuild();
  return { dryRun: true, action, command, parameters: Object.fromEntries(Object.entries(options).filter(([key]) => !['json', 'pretty', 'dry_run', 'yes'].includes(key))) };
}
