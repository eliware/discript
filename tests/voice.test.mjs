import { createDiscordApi } from '../src/discord.mjs';

describe('voice operations', () => {
  test('previews voice join and leave without connecting', async () => {
    const channel = { id: '2', type: 'voice', guild: { id: '1', members: { me: { permissions: { has: () => true } } } } };
    const api = createDiscordApi({ channels: { cache: new Map([['2', channel]]) } }, { dryRun: true });
    await expect(api.voice.join('2')).resolves.toMatchObject({ dryRun: true, guildId: '1', joined: true });
    await expect(api.voice.leave('1')).resolves.toMatchObject({ dryRun: true, guildId: '1', left: true });
  });

  test('reports disconnected voice status', () => {
    const api = createDiscordApi({ channels: { cache: new Map() } });
    expect(api.voice.status('1')).toEqual({ guildId: '1', connected: false });
  });
});
