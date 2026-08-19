import { describe, expect, test } from '@jest/globals';
import { loadConfig, requireTestGuild } from '../src/config.mjs';

describe('configuration', () => {
  test('loads token and test guild without exposing defaults', () => {
    expect(loadConfig({ DISCORD_TOKEN: 'token', TEST_GUILD: '123' })).toEqual({ token: 'token', testGuild: '123', intents: ['Guilds', 'GuildMessages', 'GuildMembers'] });
  });

  test('loads comma-separated gateway intents from the environment', () => {
    expect(loadConfig({ DISCRIPT_INTENTS: 'Guilds, MessageContent' }).intents).toEqual(['Guilds', 'MessageContent']);
  });

  test('validates test guild IDs', () => {
    expect(requireTestGuild({ testGuild: '123' })).toBe('123');
    expect(() => requireTestGuild({ testGuild: 'guild' })).toThrow('must be a Discord guild ID');
  });
});
