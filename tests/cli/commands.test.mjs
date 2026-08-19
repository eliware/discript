import { describe, expect, test } from '@jest/globals';

import { createDiscordApi } from '../../src/discord.mjs';



// Cross-cutting coverage intentionally stays here because it verifies the
// normalized relationship between multiple command API domains.
describe('cross-cutting capability lookup', () => {
  test('returns normalized guild and channel values', () => {
    const channel = { id: '2', name: 'general', type: 0 };
    const guild = { id: '1', name: 'test', channels: { cache: new Map([['2', channel]]) } };
    const api = createDiscordApi({
      channels: { cache: new Map([['2', channel]]) },
      guilds: { cache: new Map([['1', guild]]) },
    });
    expect(api.guilds.get('1').name).toBe('test');
    expect(api.channels.get('2')).toMatchObject({ id: '2', name: 'general' });
  });
});
