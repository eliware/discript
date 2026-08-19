import { createDiscordApi } from '../src/discord.mjs';

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
});
