import { EventEmitter } from 'node:events';
import { describe, expect, jest, test } from '@jest/globals';
import { createDiscordRuntime } from '../src/runtime.mjs';
import { createDiscordApi } from '../src/discord.mjs';
import { run } from '../src/cli.mjs';
import { loadConfig, requireTestGuild } from '../src/config.mjs';

describe('Discord runtime lifecycle', () => {
  test('rejects missing tokens before constructing a client', async () => {
    await expect(createDiscordRuntime({ token: '' })).rejects.toMatchObject({ code: 'DISCORD_TOKEN_MISSING', exitCode: 4 });
  });

  test('starts, signals stop, and shuts down idempotently', async () => {
    const client = new EventEmitter();
    client.login = jest.fn(async () => { queueMicrotask(() => client.emit('clientReady')); });
    client.destroy = jest.fn(async () => undefined);
    const runtime = await createDiscordRuntime({ token: 'test-token', client });
    expect(client.login).toHaveBeenCalledWith('test-token');
    const stopped = runtime.waitForStop();
    await runtime.shutdown();
    await expect(stopped).resolves.toBeUndefined();
    await runtime.shutdown();
    expect(client.destroy).toHaveBeenCalledTimes(1);
  });
});


const live = process.env.DISCRIPT_LIVE === '1';

describe('live Discord integration', () => {
  (live ? test : test.skip)('lists the configured test guild', async () => {
    const config = loadConfig();
    const runtime = await createDiscordRuntime({ token: config.token });
    try {
      const guild = createDiscordApi(runtime.client).guilds.get(requireTestGuild(config));
      expect(guild.id).toBe(config.testGuild);
    } finally {
      await runtime.shutdown();
    }
  }, 30000);

  (live ? test : test.skip)('registers an event handler, runs a timer, and inspects voice status without mutation', async () => {
    const config = loadConfig();
    const runtime = await createDiscordRuntime({ token: config.token });
    try {
      const payload = await new Promise(resolve => {
        runtime.client.once('discriptLiveSynthetic', resolve);
        setTimeout(() => runtime.client.emit('discriptLiveSynthetic', { ok: true }), 10);
      });
      expect(payload).toEqual({ ok: true });
      const timerResult = await new Promise(resolve => setTimeout(() => resolve('timer-fired'), 10));
      expect(timerResult).toBe('timer-fired');
      const status = await createDiscordApi(runtime.client).voice.status(requireTestGuild(config));
      expect(status).toMatchObject({ guildId: config.testGuild, connected: false });
    } finally {
      await runtime.shutdown();
    }
  }, 30000);

  (live ? test : test.skip)('validates a direct dry-run through the CLI without mutation', async () => {
    const config = loadConfig();
    const output = [];
    const result = await run(['channels', 'create', '--guild', requireTestGuild(config), '--name', 'discript-live-preview', '--dry-run', '--validate', '--json'], { stdout: value => output.push(value), stdin: { isTTY: true } });
    expect(result).toMatchObject({ dryRun: true, guildId: config.testGuild, name: 'discript-live-preview' });
    expect(output).toHaveLength(1);
  }, 30000);

  (live ? test : test.skip)('validates role, message, and scheduled-event previews without mutation', async () => {
    const config = loadConfig();
    const runtime = await createDiscordRuntime({ token: config.token });
    try {
      const api = createDiscordApi(runtime.client, { dryRun: true });
      const guild = api.guilds.get(requireTestGuild(config));
      await expect(guild.roles.create('discript-validation-role')).resolves.toMatchObject({ dryRun: true, guildId: config.testGuild });
      const textChannel = [...runtime.client.channels.cache.values()].find(channel => channel.guild?.id === config.testGuild && channel.type === 0);
      expect(textChannel).toBeTruthy();
      await expect(api.channels.get(textChannel.id).send('discript-validation-message')).resolves.toMatchObject({ dryRun: true, channelId: textChannel.id });
      await expect(guild.scheduledEvents.create({ name: 'discript-validation-event', scheduledStartTime: '2030-01-01T00:00:00Z', entityType: 3 })).resolves.toMatchObject({ dryRun: true });
    } finally {
      await runtime.shutdown();
    }
  }, 30000);

  (live ? test : test.skip)('validates protected moderation and invalid voice targets', async () => {
    const config = loadConfig();
    const runtime = await createDiscordRuntime({ token: config.token });
    try {
      const api = createDiscordApi(runtime.client, { dryRun: true });
      const guild = api.guilds.get(requireTestGuild(config));
      const botMember = [...runtime.client.guilds.cache.get(config.testGuild).members.cache.values()].find(member => member.user?.bot);
      expect(botMember).toBeTruthy();
      await expect(guild.members.get(botMember.id).timeout(1000)).rejects.toMatchObject({ code: 'MEMBER_PROTECTED', exitCode: 5 });
      const category = [...runtime.client.channels.cache.values()].find(channel => channel.guild?.id === config.testGuild && channel.type === 4);
      expect(category).toBeTruthy();
      await expect(api.voice.join(category.id)).rejects.toMatchObject({ code: 'VOICE_CHANNEL_REQUIRED', exitCode: 2 });
    } finally {
      await runtime.shutdown();
    }
  }, 30000);

  (live ? test : test.skip)('lists channel webhooks without mutation', async () => {
    const config = loadConfig();
    const runtime = await createDiscordRuntime({ token: config.token });
    try {
      const textChannel = [...runtime.client.channels.cache.values()].find(channel => channel.guild?.id === config.testGuild && channel.type === 0);
      expect(textChannel).toBeTruthy();
      const webhooks = await createDiscordApi(runtime.client).channels.get(textChannel.id).webhooks.list();
      expect(Array.isArray(webhooks)).toBe(true);
      expect(webhooks.every(webhook => webhook.channelId === textChannel.id)).toBe(true);
    } finally {
      await runtime.shutdown();
    }
  }, 30000);

  (live ? test : test.skip)('lists channel permission overwrites without mutation', async () => {
    const config = loadConfig();
    const runtime = await createDiscordRuntime({ token: config.token });
    try {
      const textChannel = [...runtime.client.channels.cache.values()].find(channel => channel.guild?.id === config.testGuild && channel.type === 0);
      expect(textChannel).toBeTruthy();
      const overwrites = createDiscordApi(runtime.client).channels.get(textChannel.id).permissions.list();
      expect(Array.isArray(overwrites)).toBe(true);
      expect(overwrites.every(overwrite => overwrite.id)).toBe(true);
    } finally {
      await runtime.shutdown();
    }
  }, 30000);

  (live ? test : test.skip)('reads member voice status without mutation', async () => {
    const config = loadConfig();
    const runtime = await createDiscordRuntime({ token: config.token });
    try {
      const guild = runtime.client.guilds.cache.get(config.testGuild);
      const botMember = [...guild.members.cache.values()].find(member => member.user?.bot);
      expect(botMember).toBeTruthy();
      const status = createDiscordApi(runtime.client).guilds.get(config.testGuild).members.get(botMember.id).voice.status();
      expect(status).toMatchObject({ memberId: botMember.id, channelId: null, muted: false, deafened: false });
    } finally {
      await runtime.shutdown();
    }
  }, 30000);
});


const enabled = process.env.DISCRIPT_LIVE === '1' && process.env.DISCRIPT_LIVE_MUTATIONS === '1';

describe('live Discord mutations', () => {
  (enabled ? test : test.skip)('creates and deletes a temporary test channel', async () => {
    const config = loadConfig();
    const runtime = await createDiscordRuntime({ token: config.token });
    let created;
    try {
      const guild = createDiscordApi(runtime.client, { yes: true }).guilds.get(requireTestGuild(config));
      created = await guild.channels.create(`discript-test-${Date.now()}`);
      expect(created.id).toBeTruthy();
      const api = createDiscordApi(runtime.client, { yes: true });
      const message = await api.channels.get(created.id).send('discript mutation test');
      await api.messages.edit(created.id, message.id, 'discript mutation test edited');
      await api.messages.delete(created.id, message.id);
      await api.channels.get(created.id).delete();
    } finally {
      await runtime.shutdown();
    }
  }, 30000);
});
