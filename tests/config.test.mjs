import { describe, expect, test } from '@jest/globals';
import { loadConfig, redactedConfig, requireTestGuild } from '../src/config.mjs';

describe('configuration', () => {
  test('loads token and test guild without exposing defaults', () => {
    expect(loadConfig({ DISCORD_TOKEN: 'token', TEST_GUILD: '123' })).toMatchObject({ token: 'token', testGuild: '123', intents: ['Guilds', 'GuildMessages', 'GuildMembers'], connectionMode: 'direct', daemonMode: 'socket' });
  });

  test('loads comma-separated gateway intents from the environment', () => {
    expect(loadConfig({ DISCRIPT_INTENTS: 'Guilds, MessageContent' }).intents).toEqual(['Guilds', 'MessageContent']);
  });

  test('validates test guild IDs', () => {
    expect(requireTestGuild({ testGuild: '123' })).toBe('123');
    expect(() => requireTestGuild({ testGuild: 'guild' })).toThrow('must be a Discord guild ID');
  });

  test('loads and validates execution profiles', () => {
    const config = loadConfig({
      DISCRIPT_CONNECTION_MODE: 'daemon',
      DISCRIPT_DAEMON_MODE: 'mcp',
      DISCRIPT_MCP_TRANSPORT: 'https',
      DISCRIPT_MCP_PORT: '8443',
      DISCRIPT_MCP_AUTH_MODE: 'oauth2',
      DISCRIPT_MCP_OAUTH_REQUIRED_SCOPES: 'discord:read, discord:write',
      DISCRIPT_MCP_HTTP_REDIRECT: 'true',
    });
    expect(config).toMatchObject({ connectionMode: 'daemon', daemonMode: 'mcp', mcp: { transport: 'https', port: 8443, authMode: 'oauth2', oauthRequiredScopes: ['discord:read', 'discord:write'], httpRedirect: true } });
    expect(() => loadConfig({ DISCRIPT_CONNECTION_MODE: 'unknown' })).toThrow('DISCRIPT_CONNECTION_MODE must be one of');
  });

  test('redacts secrets for configuration inspection', () => {
    const config = loadConfig({ DISCORD_TOKEN: 'discord-secret', DISCRIPT_MCP_AUTH_TOKEN: 'mcp-secret', DISCRIPT_CLIENT_TOKEN: 'client-secret' });
    expect(redactedConfig(config)).toMatchObject({ token: '[redacted]', mcp: { authToken: '[redacted]' }, client: { token: '[redacted]' } });
    expect(JSON.stringify(redactedConfig(config))).not.toContain('secret');
  });
});
