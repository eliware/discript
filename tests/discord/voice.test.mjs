import { describe, expect, jest, test } from '@jest/globals';
import { createDiscordApi } from '../../src/discord.mjs';



describe('voice operations', () => {
  test('previews voice join and leave without connecting', async () => {
    const channel = { id: '2', type: 'voice', guild: { id: '1', members: { me: { permissions: { has: () => true } } } } };
    const api = createDiscordApi({ channels: { cache: new Map([['2', channel]]) } }, { dryRun: true, voiceModule: { getVoiceConnection: () => undefined } });
    await expect(api.voice.join('2')).resolves.toMatchObject({ dryRun: true, guildId: '1', joined: true });
    await expect(api.voice.leave('1')).resolves.toMatchObject({ dryRun: true, guildId: '1', left: true });
  });

  test('reports disconnected voice status', async () => {
    const api = createDiscordApi({ channels: { cache: new Map() } }, { voiceModule: { getVoiceConnection: () => undefined } });
    await expect(api.voice.status('1')).resolves.toEqual({ guildId: '1', connected: false });
  });

  test('requires Connect permission to join voice', async () => {
    const channel = { id: '2', type: 'voice', guild: { id: '1', members: { me: { permissions: { has: () => false } } } } };
    const api = createDiscordApi({ channels: { cache: new Map([['2', channel]]) } }, { yes: true, voiceModule: {} });
    await expect(api.voice.join('2')).rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
  });

  test('rejects a missing voice channel', async () => {
    const api = createDiscordApi({ channels: { cache: new Map() } }, { yes: true });
    await expect(api.voice.join('missing')).rejects.toMatchObject({ code: 'VOICE_CHANNEL_REQUIRED', exitCode: 2 });
  });

  test('rejects voice join without approval', async () => {
    const channel = { id: '2', type: 'voice', guild: { id: '1', members: { me: { permissions: { has: () => true } } } } };
    const api = createDiscordApi({ channels: { cache: new Map([['2', channel]]) } });
    await expect(api.voice.join('2')).rejects.toMatchObject({ code: 'CONFIRMATION_REQUIRED', exitCode: 2 });
  });

  test('rejects voice join without an adapter', async () => {
    const channel = { id: '2', type: 'voice', guild: { id: '1', voiceAdapterCreator: undefined, members: { me: { permissions: { has: () => true } } } } };
    const api = createDiscordApi({ channels: { cache: new Map([['2', channel]]) } }, { yes: true, voiceModule: {} });
    await expect(api.voice.join('2')).rejects.toMatchObject({ code: 'VOICE_UNSUPPORTED', exitCode: 1 });
  });

  test('reports an active voice connection', async () => {
    const connection = { state: { status: 'ready' } };
    const api = createDiscordApi({ channels: { cache: new Map() } }, { voiceModule: { getVoiceConnection: () => connection } });
    await expect(api.voice.status('1')).resolves.toEqual({ guildId: '1', connected: true, status: 'ready' });
  });

  test('leaves and destroys an active connection', async () => {
    const destroy = jest.fn();
    const api = createDiscordApi({ channels: { cache: new Map() } }, { yes: true, voiceModule: { getVoiceConnection: () => ({ destroy }) } });
    await expect(api.voice.leave('1')).resolves.toEqual({ guildId: '1', left: true });
    expect(destroy).toHaveBeenCalled();
  });

  test('leaving an absent connection remains successful', async () => {
    const api = createDiscordApi({ channels: { cache: new Map() } }, { yes: true, voiceModule: { getVoiceConnection: () => undefined } });
    await expect(api.voice.leave('1')).resolves.toEqual({ guildId: '1', left: true });
  });

  test('supports stage channels', async () => {
    const channel = { id: '2', type: 'stage', guild: { id: '1', voiceAdapterCreator: () => {}, members: { me: { permissions: { has: () => true } } } } };
    const joinVoiceChannel = jest.fn(() => ({ state: { status: 'connecting' } }));
    const api = createDiscordApi({ channels: { cache: new Map([['2', channel]]) } }, { yes: true, voiceModule: { joinVoiceChannel } });
    await expect(api.voice.join('2')).resolves.toMatchObject({ joined: true, status: 'connecting' });
  });
});
