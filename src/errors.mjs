export function formatError(error, options = {}) {
  const payload = {
    error: error?.message || String(error),
    code: error?.code || 'DISCRIPT_ERROR',
  };
  if (options.json) return JSON.stringify(payload);
  return `${payload.code}: ${payload.error}`;
}
