import { describe, expect, jest, test } from '@jest/globals';
import { createDiscordRest } from '../src/rest.mjs';

describe('REST transport', () => {
  test('creates a tokenized REST requester and forwards requests', async () => {
    const request = jest.fn(async () => ({ id: '1' }));
    const api = createDiscordRest({ token: 'test-token', rest: { request } });
    await expect(api.request('/guilds/1')).resolves.toEqual({ id: '1' });
    expect(request).toHaveBeenCalledWith({ fullRoute: '/guilds/1' });
  });

  test('rejects without a token', () => {
    expect(() => createDiscordRest({ token: '' })).toThrow(expect.objectContaining({ code: 'DISCORD_TOKEN_MISSING', exitCode: 4 }));
  });
});
