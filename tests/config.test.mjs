import { describe, expect, test } from '@jest/globals';
import { loadConfig, redactedConfig, requireTestGuild, validateConfig } from '../src/config.mjs';

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
      DISCRIPT_MCP_AUTH_MODE: 'oauth2', DISCRIPT_MCP_OAUTH_ISSUER: 'https://auth.example', DISCRIPT_MCP_OAUTH_RESOURCE: 'https://discript.example/mcp', DISCRIPT_MCP_OAUTH_INTROSPECTION_ENDPOINT: 'https://auth.example/introspect',
      DISCRIPT_MCP_OAUTH_REQUIRED_SCOPES: 'discord:read, discord:write',
      DISCRIPT_MCP_HTTP_REDIRECT: 'true',
    });
    expect(config).toMatchObject({ connectionMode: 'daemon', daemonMode: 'mcp', mcp: { transport: 'https', port: 8443, authMode: 'oauth2', oauthRequiredScopes: ['discord:read', 'discord:write'], httpRedirect: true } });
    expect(() => loadConfig({ DISCRIPT_CONNECTION_MODE: 'unknown' })).toThrow('DISCRIPT_CONNECTION_MODE must be one of');
  });

  test('redacts secrets for configuration inspection', () => {
    const config = loadConfig({ DISCORD_TOKEN: 'discord-secret', DISCRIPT_MCP_AUTH_TOKEN: 'mcp-secret', DISCRIPT_MCP_OAUTH_CLIENT_SECRET: 'oauth-secret', DISCRIPT_CLIENT_TOKEN: 'client-secret', DISCRIPT_CLIENT_HEADERS: '{"Authorization":"header-secret","X-Agent":"discript"}' });
    expect(redactedConfig(config)).toMatchObject({ token: '[redacted]', mcp: { authToken: '[redacted]' }, client: { token: '[redacted]' } });
    expect(redactedConfig(config).client.headers).toEqual({ Authorization: '[redacted]', 'X-Agent': 'discript' });
    expect(JSON.stringify(redactedConfig(config))).not.toContain('secret');
    expect(redactedConfig({ token: null, mcp: {}, client: {} })).toMatchObject({ token: null, mcp: {}, client: { headers: {} } });
  });

  test('rejects incompatible MCP profiles before startup', () => {
    expect(() => validateConfig(loadConfig({ DISCRIPT_DAEMON_MODE: 'mcp', DISCRIPT_MCP_TRANSPORT: 'stdio' }))).toThrow('requires an HTTP or HTTPS');
    expect(() => validateConfig(loadConfig({ DISCRIPT_MCP_HTTP_REDIRECT: 'true', DISCRIPT_MCP_HTTP_PORT: '8080' }))).toThrow('requires DISCRIPT_MCP_HTTP_PORT and DISCRIPT_MCP_HTTPS_PORT');
    expect(() => validateConfig(loadConfig({ DISCRIPT_MCP_HTTPS_PORT: '8443' }))).toThrow('requires DISCRIPT_MCP_TLS_KEY_FILE');
  });

  test('accepts a complete dual-listener HTTPS profile', () => {
    expect(validateConfig(loadConfig({
      DISCRIPT_MCP_HTTP_REDIRECT: 'true', DISCRIPT_MCP_HTTP_PORT: '8080', DISCRIPT_MCP_HTTPS_PORT: '8443',
      DISCRIPT_MCP_TLS_KEY_FILE: '/run/key.pem', DISCRIPT_MCP_TLS_CERT_FILE: '/run/cert.pem',
    })).mcp).toMatchObject({ httpPort: 8080, httpsPort: 8443, httpRedirect: true });
  });

  test('accepts inline TLS material and redacts it for inspection', () => {
    const config = loadConfig({ DISCRIPT_MCP_HTTPS_PORT: '8443', DISCRIPT_MCP_TLS_KEY: 'inline-key', DISCRIPT_MCP_TLS_CERT: 'inline-cert', DISCRIPT_MCP_TLS_CA: 'inline-ca' });
    expect(validateConfig(config).mcp).toMatchObject({ tlsKey: 'inline-key', tlsCert: 'inline-cert', tlsCa: 'inline-ca' });
    expect(redactedConfig(config).mcp).toMatchObject({ tlsKey: '[redacted]', tlsCert: '[redacted]', tlsCa: '[redacted]' });
  });

  test('loads remote client profile and validates client mode', () => {
    const config = loadConfig({
      DISCRIPT_CONNECTION_MODE: 'mcp-client', DISCRIPT_CLIENT_URL: 'https://agent.example/mcp',
      DISCRIPT_CLIENT_TRANSPORT: 'https', DISCRIPT_CLIENT_HEADERS: '{"X-Agent":"discript","X-Run":"1"}',
      DISCRIPT_CLIENT_RECONNECT: 'false', DISCRIPT_CLIENT_MAX_RECONNECT_ATTEMPTS: '3', DISCRIPT_CLIENT_TIMEOUT: '5000', DISCRIPT_CLIENT_MAX_OUTPUT_BYTES: '2048',
    });
    expect(validateConfig(config).client).toMatchObject({ url: 'https://agent.example/mcp', transport: 'https', headers: { 'X-Agent': 'discript', 'X-Run': '1' }, reconnect: false, maxReconnectAttempts: 3, timeout: 5000, maxOutputBytes: 2048 });
    expect(() => validateConfig(loadConfig({ DISCRIPT_CONNECTION_MODE: 'mcp-client' }))).toThrow('requires DISCRIPT_CLIENT_URL');
    expect(() => validateConfig(loadConfig({ DISCRIPT_CONNECTION_MODE: 'mcp-client', DISCRIPT_CLIENT_TRANSPORT: 'stdio' }))).toThrow('requires DISCRIPT_CLIENT_COMMAND');
    expect(validateConfig(loadConfig({ DISCRIPT_CONNECTION_MODE: 'mcp-client', DISCRIPT_CLIENT_TRANSPORT: 'stdio', DISCRIPT_CLIENT_COMMAND: 'discript', DISCRIPT_CLIENT_ARGS: '["mcp","--stdio"]' })).client).toMatchObject({ command: 'discript', args: ['mcp', '--stdio'] });
    expect(() => loadConfig({ DISCRIPT_CLIENT_ARGS: '{}'})).toThrow('must be a JSON array');
    expect(() => loadConfig({ DISCRIPT_CLIENT_HEADERS: 'not-json' })).toThrow('must be a JSON object');
    expect(() => validateConfig(loadConfig({ DISCRIPT_CONNECTION_MODE: 'mcp-client', DISCRIPT_CLIENT_URL: 'not-a-url' }))).toThrow('must be a valid HTTP, HTTPS, or file URL');
    expect(() => validateConfig(loadConfig({ DISCRIPT_CONNECTION_MODE: 'mcp-client', DISCRIPT_CLIENT_URL: 'ftp://agent.example/mcp' }))).toThrow('must be a valid HTTP, HTTPS, or file URL');
    expect(() => loadConfig({ DISCRIPT_MCP_PORT: 'not-a-number' })).toThrow('must be an integer');
    expect(() => loadConfig({ DISCRIPT_CLIENT_HEADERS: '[]' })).toThrow('must be a JSON object');
  });

  test('requires complete OAuth2 server configuration', () => {
    expect(() => validateConfig(loadConfig({ DISCRIPT_MCP_AUTH_MODE: 'oauth2' }))).toThrow('requires issuer, resource, and introspection endpoint');
    expect(validateConfig(loadConfig({ DISCRIPT_MCP_AUTH_MODE: 'oauth2', DISCRIPT_MCP_OAUTH_ISSUER: 'https://auth', DISCRIPT_MCP_OAUTH_RESOURCE: 'https://resource', DISCRIPT_MCP_OAUTH_INTROSPECTION_ENDPOINT: 'https://auth/introspect' })).mcp.authMode).toBe('oauth2');
  });

  test('covers default validation and missing test guild errors', () => {
    expect(() => validateConfig()).not.toThrow();
    expect(() => validateConfig({ connectionMode: 'direct' })).not.toThrow();
    expect(redactedConfig()).toBeDefined();
    expect(() => requireTestGuild({})).toThrow('TEST_GUILD is not configured');
    expect(requireTestGuild()).toBeTruthy();
  });
});
