import 'dotenv/config';

export const DEFAULT_INTENTS = ['Guilds', 'GuildMessages', 'GuildMembers'];
export const CONNECTION_MODES = ['direct', 'daemon', 'mcp-client'];
export const DAEMON_MODES = ['socket', 'mcp', 'hybrid'];
export const MCP_TRANSPORTS = ['stdio', 'http', 'https'];
export const MCP_AUTH_MODES = ['none', 'static', 'bearer-passthrough', 'oauth2'];
export const MCP_CLIENT_TRANSPORTS = ['http', 'https', 'sse', 'stdio'];

export function parseIntents(value) {
  const raw = String(value ?? '').trim();
  return raw ? raw.split(',').map(name => name.trim()).filter(Boolean) : [...DEFAULT_INTENTS];
}

export function loadConfig(env = process.env) {
  const token = String(env.DISCORD_TOKEN ?? '').trim();
  const testGuild = String(env.TEST_GUILD ?? '').trim();
  const intents = parseIntents(env.DISCRIPT_INTENTS);
  const capabilities = listValue(env.DISCRIPT_CAPABILITIES);
  const connectionMode = enumValue(env.DISCRIPT_CONNECTION_MODE, CONNECTION_MODES, 'direct', 'DISCRIPT_CONNECTION_MODE');
  const daemonMode = enumValue(env.DISCRIPT_DAEMON_MODE, DAEMON_MODES, 'socket', 'DISCRIPT_DAEMON_MODE');
  const mcpTransport = enumValue(env.DISCRIPT_MCP_TRANSPORT, MCP_TRANSPORTS, 'http', 'DISCRIPT_MCP_TRANSPORT');
  const mcpAuthMode = enumValue(env.DISCRIPT_MCP_AUTH_MODE, MCP_AUTH_MODES, 'none', 'DISCRIPT_MCP_AUTH_MODE');
  const clientTransport = enumValue(env.DISCRIPT_CLIENT_TRANSPORT, MCP_CLIENT_TRANSPORTS, 'http', 'DISCRIPT_CLIENT_TRANSPORT');
  return {
    token: token || null,
    testGuild: testGuild || null,
    intents,
    capabilities,
    connectionMode,
    daemonMode,
    mcp: {
      transport: mcpTransport,
      host: stringValue(env.DISCRIPT_MCP_HOST, '127.0.0.1'),
      port: numberValue(env.DISCRIPT_MCP_PORT, 8765, 'DISCRIPT_MCP_PORT'),
      httpPort: numberValue(env.DISCRIPT_MCP_HTTP_PORT, null, 'DISCRIPT_MCP_HTTP_PORT'),
      httpsPort: numberValue(env.DISCRIPT_MCP_HTTPS_PORT, null, 'DISCRIPT_MCP_HTTPS_PORT'),
      endpoint: stringValue(env.DISCRIPT_MCP_ENDPOINT, '/mcp'),
      authMode: mcpAuthMode,
      authToken: stringValue(env.DISCRIPT_MCP_AUTH_TOKEN, null),
      oauthIssuer: stringValue(env.DISCRIPT_MCP_OAUTH_ISSUER, null),
      oauthResource: stringValue(env.DISCRIPT_MCP_OAUTH_RESOURCE, null),
      oauthRequiredScopes: listValue(env.DISCRIPT_MCP_OAUTH_REQUIRED_SCOPES),
      oauthIntrospectionEndpoint: stringValue(env.DISCRIPT_MCP_OAUTH_INTROSPECTION_ENDPOINT, null),
      oauthClientId: stringValue(env.DISCRIPT_MCP_OAUTH_CLIENT_ID, null),
      oauthClientSecret: stringValue(env.DISCRIPT_MCP_OAUTH_CLIENT_SECRET, null),
      tlsKeyFile: stringValue(env.DISCRIPT_MCP_TLS_KEY_FILE, null),
      tlsCertFile: stringValue(env.DISCRIPT_MCP_TLS_CERT_FILE, null),
      tlsCaFile: stringValue(env.DISCRIPT_MCP_TLS_CA_FILE, null),
      tlsKey: stringValue(env.DISCRIPT_MCP_TLS_KEY, null),
      tlsCert: stringValue(env.DISCRIPT_MCP_TLS_CERT, null),
      tlsCa: stringValue(env.DISCRIPT_MCP_TLS_CA, null),
      httpRedirect: booleanValue(env.DISCRIPT_MCP_HTTP_REDIRECT, false),
      allowedOrigins: listValue(env.DISCRIPT_MCP_ALLOWED_ORIGINS),
      executionTimeout: numberValue(env.DISCRIPT_MCP_EXECUTION_TIMEOUT, 300000, 'DISCRIPT_MCP_EXECUTION_TIMEOUT'),
      maxConcurrent: numberValue(env.DISCRIPT_MCP_MAX_CONCURRENT, 4, 'DISCRIPT_MCP_MAX_CONCURRENT'),
      maxPending: numberValue(env.DISCRIPT_MCP_MAX_PENDING, 32, 'DISCRIPT_MCP_MAX_PENDING'),
      maxOutputBytes: numberValue(env.DISCRIPT_MCP_MAX_OUTPUT_BYTES, 1048576, 'DISCRIPT_MCP_MAX_OUTPUT_BYTES'),
    },
    client: {
      url: stringValue(env.DISCRIPT_CLIENT_URL, null),
      transport: clientTransport,
      token: stringValue(env.DISCRIPT_CLIENT_TOKEN, null),
      headers: headersValue(env.DISCRIPT_CLIENT_HEADERS),
      command: stringValue(env.DISCRIPT_CLIENT_COMMAND, null),
      args: jsonArrayValue(env.DISCRIPT_CLIENT_ARGS, 'DISCRIPT_CLIENT_ARGS'),
      reconnect: booleanValue(env.DISCRIPT_CLIENT_RECONNECT, true),
      reconnectBaseDelay: numberValue(env.DISCRIPT_CLIENT_RECONNECT_BASE_DELAY, 1000, 'DISCRIPT_CLIENT_RECONNECT_BASE_DELAY'),
      reconnectMaxDelay: numberValue(env.DISCRIPT_CLIENT_RECONNECT_MAX_DELAY, 60000, 'DISCRIPT_CLIENT_RECONNECT_MAX_DELAY'),
      maxReconnectAttempts: numberValue(env.DISCRIPT_CLIENT_MAX_RECONNECT_ATTEMPTS, null, 'DISCRIPT_CLIENT_MAX_RECONNECT_ATTEMPTS'),
      timeout: numberValue(env.DISCRIPT_CLIENT_TIMEOUT, 300000, 'DISCRIPT_CLIENT_TIMEOUT'),
      maxOutputBytes: numberValue(env.DISCRIPT_CLIENT_MAX_OUTPUT_BYTES, 1048576, 'DISCRIPT_CLIENT_MAX_OUTPUT_BYTES'),
    },
  };
}

export function redactedConfig(config = loadConfig()) {
  return {
    ...config,
    token: redact(config.token),
    mcp: { ...config.mcp, authToken: redact(config.mcp.authToken), oauthClientSecret: redact(config.mcp.oauthClientSecret), tlsKey: redact(config.mcp.tlsKey), tlsCert: redact(config.mcp.tlsCert), tlsCa: redact(config.mcp.tlsCa) },
    client: { ...config.client, token: redact(config.client.token), headers: redactedHeaders(config.client.headers) },
  };
}

export function validateConfig(config = loadConfig()) {
  const mcp = config.mcp ?? {};
  if (mcp.authMode === 'oauth2' && (!mcp.oauthIssuer || !mcp.oauthResource || !mcp.oauthIntrospectionEndpoint)) {
    throw configurationError('OAuth2 MCP auth requires issuer, resource, and introspection endpoint.');
  }
  if (config.daemonMode === 'mcp' && mcp.transport === 'stdio') {
    throw configurationError('DISCRIPT_DAEMON_MODE=mcp requires an HTTP or HTTPS MCP transport.');
  }
  if (mcp.httpRedirect && (!mcp.httpPort || !mcp.httpsPort)) {
    throw configurationError('DISCRIPT_MCP_HTTP_REDIRECT requires DISCRIPT_MCP_HTTP_PORT and DISCRIPT_MCP_HTTPS_PORT.');
  }
  if (mcp.httpsPort && ((!mcp.tlsKeyFile && !mcp.tlsKey) || (!mcp.tlsCertFile && !mcp.tlsCert))) {
    throw configurationError('An HTTPS MCP listener requires DISCRIPT_MCP_TLS_KEY_FILE and DISCRIPT_MCP_TLS_CERT_FILE.');
  }
  const client = config.client ?? {};
  if (config.connectionMode === 'mcp-client' && client.transport !== 'stdio' && !client.url) {
    throw configurationError('DISCRIPT_CONNECTION_MODE=mcp-client requires DISCRIPT_CLIENT_URL.');
  }
  if (client.url) {
    try {
      const url = new URL(client.url);
      if (!['http:', 'https:', 'file:'].includes(url.protocol)) throw new Error('unsupported protocol');
    } catch {
      throw configurationError('DISCRIPT_CLIENT_URL must be a valid HTTP, HTTPS, or file URL.');
    }
  }
  if (config.connectionMode === 'mcp-client' && client.transport === 'stdio' && !client.command) {
    throw configurationError('DISCRIPT_CLIENT_TRANSPORT=stdio requires DISCRIPT_CLIENT_COMMAND.');
  }
  return config;
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

function headersValue(value) {
  if (value === undefined || value === null || String(value).trim() === '') return {};
  try {
    const result = JSON.parse(String(value));
    if (!result || Array.isArray(result) || typeof result !== 'object') throw new Error('not an object');
    return Object.fromEntries(Object.entries(result).map(([key, item]) => [String(key), String(item)]));
  } catch {
    throw configurationError('DISCRIPT_CLIENT_HEADERS must be a JSON object.');
  }
}

function jsonArrayValue(value, name) {
  if (value === undefined || value === null || String(value).trim() === '') return [];
  try {
    const result = JSON.parse(String(value));
    if (!Array.isArray(result)) throw new Error('not an array');
    return result.map(item => String(item));
  } catch {
    throw configurationError(`${name} must be a JSON array.`);
  }
}

function redact(value) {
  return value ? '[redacted]' : null;
}

function redactedHeaders(headers = {}) {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key, /authorization|token|secret|api[-_]?key/i.test(key) ? redact(value) : value]));
}

function configurationError(message) {
  return Object.assign(new Error(message), { code: 'INVALID_CONFIGURATION', exitCode: 2 });
}

export function requireTestGuild(config = loadConfig()) {
  if (!config.testGuild) throw Object.assign(new Error('TEST_GUILD is not configured.'), { code: 'TEST_GUILD_MISSING', exitCode: 2 });
  if (!/^\d+$/.test(config.testGuild)) throw Object.assign(new Error('TEST_GUILD must be a Discord guild ID.'), { code: 'TEST_GUILD_INVALID', exitCode: 2 });
  return config.testGuild;
}
