export function formatError(error, options = {}) {
  const payload = structuredError(error);
  if (options.json) return JSON.stringify(payload);
  return `${payload.code}: ${payload.error}`;
}

export function structuredError(error) {
  const code = normalizeCode(error);
  const payload = {
    error: sanitizeText(error?.message || String(error)),
    code,
    exitCode: Number.isInteger(error?.exitCode) ? error.exitCode : defaultExitCode(code),
  };
  const details = sanitizeDetails(error?.details ?? {
    ...(typeof error?.code === 'number' ? { discordCode: error.code } : {}),
    ...(error?.status !== undefined ? { status: error.status } : {}),
    ...(error?.method ? { method: error.method } : {}),
    ...(error?.path ? { path: error.path } : {}),
    ...(error?.retryAfter !== undefined ? { retryAfter: error.retryAfter } : {}),
  });
  if (details !== undefined) payload.details = details;
  return payload;
}

function normalizeCode(error) {
  if (typeof error?.code === 'string' && error.code.length > 0) return error.code;
  if (typeof error?.code === 'number') return 'DISCORD_API_ERROR';
  if (error?.name === 'DiscordAPIError' || error?.name === 'HTTPError') return 'DISCORD_API_ERROR';
  return 'DISCRIPT_ERROR';
}

function defaultExitCode(code) {
  if (code === 'MISSING_PERMISSION' || code === 'FORBIDDEN' || code === 'DISCORD_API_ERROR') return 5;
  if (code === 'INVALID_OPTION' || code.endsWith('_REQUIRED') || code === 'PARSE_ERROR') return code === 'PARSE_ERROR' ? 3 : 2;
  return 1;
}

function sanitizeDetails(details) {
  if (!details || typeof details !== 'object') return details === undefined ? undefined : { value: String(details) };
  const allowed = ['suggestions', 'message', 'discordCode', 'status', 'method', 'path', 'retryAfter', 'stack'];
  const filtered = Object.fromEntries(Object.entries(details).filter(([key]) => allowed.includes(key)).map(([key, value]) => [key, typeof value === 'string' ? sanitizeText(value) : value]));
  return Object.keys(filtered).length ? filtered : undefined;
}

function sanitizeText(value) {
  return String(value)
    .replace(/(DISCORD_TOKEN|[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API[_-]?KEY))\s*[:=]\s*([^\s,;]+)/gi, '$1=[redacted]')
    .replace(/("(?:token|secret|password|api[_-]?key)"\s*:\s*")([^"]+)(")/gi, '$1[redacted]$3')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[redacted]');
}
