import 'dotenv/config';

export const DEFAULT_INTENTS = ['Guilds', 'GuildMessages', 'GuildMembers'];
export const CONNECTION_MODES = ['direct', 'daemon', 'mcp-client'];
export const DAEMON_MODES = ['socket', 'mcp'];
export const MCP_TRANSPORTS = ['stdio', 'http', 'https'];
export const MCP_AUTH_MODES = ['none', 'static', 'bearer-passthrough', 'oauth2'];

export function parseIntents(value) {
  const raw = String(value ?? '').trim();
  return raw ? raw.split(',').map(name => name.trim()).filter(Boolean) : [...DEFAULT_INTENTS];
}

export function loadConfig(env = process.env) {
  const token = String(env.DISCORD_TOKEN ?? '').trim();
  const testGuild = String(env.TEST_GUILD ?? '').trim();
  const intents = parseIntents(env.DISCRIPT_INTENTS);
  const connectionMode = enumValue(env.DISCRIPT_CONNECTION_MODE, CONNECTION_MODES, 'direct', 'DISCRIPT_CONNECTION_MODE');
  const daemonMode = enumValue(env.DISCRIPT_DAEMON_MODE, DAEMON_MODES, 'socket', 'DISCRIPT_DAEMON_MODE');
  const mcpTransport = enumValue(env.DISCRIPT_MCP_TRANSPORT, MCP_TRANSPORTS, 'http', 'DISCRIPT_MCP_TRANSPORT');
  const mcpAuthMode = enumValue(env.DISCRIPT_MCP_AUTH_MODE, MCP_AUTH_MODES, 'none', 'DISCRIPT_MCP_AUTH_MODE');
  return {
    token: token || null,
    testGuild: testGuild || null,
    intents,
    connectionMode,
    daemonMode,
    mcp: {
      transport: mcpTransport,
      host: stringValue(env.DISCRIPT_MCP_HOST, '127.0.0.1'),
      port: numberValue(env.DISCRIPT_MCP_PORT, 8765, 'DISCRIPT_MCP_PORT'),
      endpoint: stringValue(env.DISCRIPT_MCP_ENDPOINT, '/mcp'),
      authMode: mcpAuthMode,
      authToken: stringValue(env.DISCRIPT_MCP_AUTH_TOKEN, null),
      oauthIssuer: stringValue(env.DISCRIPT_MCP_OAUTH_ISSUER, null),
      oauthResource: stringValue(env.DISCRIPT_MCP_OAUTH_RESOURCE, null),
      oauthRequiredScopes: listValue(env.DISCRIPT_MCP_OAUTH_REQUIRED_SCOPES),
      tlsKeyFile: stringValue(env.DISCRIPT_MCP_TLS_KEY_FILE, null),
      tlsCertFile: stringValue(env.DISCRIPT_MCP_TLS_CERT_FILE, null),
      tlsCaFile: stringValue(env.DISCRIPT_MCP_TLS_CA_FILE, null),
      httpRedirect: booleanValue(env.DISCRIPT_MCP_HTTP_REDIRECT, false),
      allowedOrigins: listValue(env.DISCRIPT_MCP_ALLOWED_ORIGINS),
    },
    client: {
      url: stringValue(env.DISCRIPT_CLIENT_URL, null),
      transport: stringValue(env.DISCRIPT_CLIENT_TRANSPORT, 'http'),
      token: stringValue(env.DISCRIPT_CLIENT_TOKEN, null),
      reconnect: booleanValue(env.DISCRIPT_CLIENT_RECONNECT, true),
      reconnectBaseDelay: numberValue(env.DISCRIPT_CLIENT_RECONNECT_BASE_DELAY, 1000, 'DISCRIPT_CLIENT_RECONNECT_BASE_DELAY'),
      reconnectMaxDelay: numberValue(env.DISCRIPT_CLIENT_RECONNECT_MAX_DELAY, 60000, 'DISCRIPT_CLIENT_RECONNECT_MAX_DELAY'),
      maxReconnectAttempts: numberValue(env.DISCRIPT_CLIENT_MAX_RECONNECT_ATTEMPTS, null, 'DISCRIPT_CLIENT_MAX_RECONNECT_ATTEMPTS'),
    },
  };
}

export function redactedConfig(config = loadConfig()) {
  return {
    ...config,
    token: redact(config.token),
    mcp: { ...config.mcp, authToken: redact(config.mcp.authToken) },
    client: { ...config.client, token: redact(config.client.token) },
  };
}

function enumValue(value, allowed, fallback, name) {
  const result = String(value ?? '').trim() || fallback;
  if (!allowed.includes(result)) throw Object.assign(new Error(`${name} must be one of: ${allowed.join(', ')}.`), { code: 'INVALID_CONFIGURATION', exitCode: 2 });
  return result;
}

function stringValue(value, fallback) {
  const result = String(value ?? '').trim();
  return result || fallback;
}

function numberValue(value, fallback, name) {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  const result = Number(value);
  if (!Number.isInteger(result) || result < 0 || result > 65535) throw Object.assign(new Error(`${name} must be an integer between 0 and 65535.`), { code: 'INVALID_CONFIGURATION', exitCode: 2 });
  return result;
}

function booleanValue(value, fallback) {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function listValue(value) {
  return String(value ?? '').split(',').map(item => item.trim()).filter(Boolean);
}

function redact(value) {
  return value ? '[redacted]' : null;
}

export function requireTestGuild(config = loadConfig()) {
  if (!config.testGuild) throw Object.assign(new Error('TEST_GUILD is not configured.'), { code: 'TEST_GUILD_MISSING', exitCode: 2 });
  if (!/^\d+$/.test(config.testGuild)) throw Object.assign(new Error('TEST_GUILD must be a Discord guild ID.'), { code: 'TEST_GUILD_INVALID', exitCode: 2 });
  return config.testGuild;
}
