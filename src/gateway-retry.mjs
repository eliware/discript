const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export function isRetryableGatewayError(error) {
  return error?.code === 'GATEWAY_STARTUP_LOCK_TIMEOUT' || error?.code === 'GATEWAY_SESSION_LIMIT' || error?.code === 'DISCORD_LOGIN_TIMEOUT' || [4000, 4008, 4009].includes(error?.closeCode ?? error?.code);
}

export async function withGatewayRetry(operation, { attempts = 3, baseDelay = 250, maxDelay = 5000, sleepFn = sleep } = {}) {
  let attempt = 0;
  while (true) {
    try { return await operation(attempt + 1); }
    catch (error) {
      attempt += 1;
      if (attempt >= attempts || !isRetryableGatewayError(error)) throw error;
      const resetDelay = Number(error.resetAfter ?? 0);
      const delay = Math.min(maxDelay, Math.max(baseDelay * 2 ** (attempt - 1), resetDelay));
      await sleepFn(delay);
    }
  }
}
