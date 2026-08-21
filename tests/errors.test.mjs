import { describe, expect, test } from '@jest/globals';
import { formatError, structuredError } from '../src/errors.mjs';

describe('CLI errors', () => {
  test('formats machine-readable errors', () => {
    expect(formatError(Object.assign(new Error('bad option'), { code: 'INVALID_OPTION' }), { json: true })).toBe('{"error":"bad option","code":"INVALID_OPTION","exitCode":2}');
  });

  test('includes structured suggestions when available', () => {
    expect(formatError(Object.assign(new Error('Unknown command'), { code: 'UNKNOWN_COMMAND', details: { suggestions: ['messages send'] } }), { json: true })).toBe('{"error":"Unknown command","code":"UNKNOWN_COMMAND","exitCode":1,"details":{"suggestions":["messages send"]}}');
  });

  test('normalizes Discord API failures without leaking arbitrary error fields', () => {
    const error = Object.assign(new Error('Missing Access'), {
      name: 'DiscordAPIError', code: 50001, status: 403, method: 'GET', path: '/guilds/1',
      requestBody: { token: 'secret' }, details: { discordCode: 50001, status: 403, method: 'GET', path: '/guilds/1', token: 'secret' },
    });
    expect(structuredError(error)).toEqual({
      error: 'Missing Access', code: 'DISCORD_API_ERROR', exitCode: 5,
      details: { discordCode: 50001, status: 403, method: 'GET', path: '/guilds/1' },
    });
  });

  test('redacts credentials embedded in error text and allowed details', () => {
    const error = Object.assign(new Error('request failed DISCORD_TOKEN=discord-secret Bearer bearer-secret'), {
      code: 'REMOTE_ERROR', details: { message: 'oauth_secret=oauth-secret', path: '/mcp' },
    });
    const result = structuredError(error);
    expect(result.error).toBe('request failed DISCORD_TOKEN=[redacted] Bearer [redacted]');
    expect(result.details.message).toBe('oauth_secret=[redacted]');
    expect(JSON.stringify(result)).not.toContain('discord-secret');
    expect(JSON.stringify(result)).not.toContain('bearer-secret');
    expect(JSON.stringify(result)).not.toContain('oauth-secret');
  });
});
