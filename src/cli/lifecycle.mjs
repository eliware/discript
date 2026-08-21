export async function withTimeout(promise, timeout, { onTimeout } = {}) {
  if (timeout === undefined) return promise;
  const timeoutMs = validateTimeout(timeout);
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => {
        try { onTimeout?.(); }
        finally { reject(Object.assign(new Error(`Execution exceeded ${timeoutMs}ms.`), { code: 'EXECUTION_TIMEOUT', exitCode: 6 })); }
      }, timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
}

export function validateTimeout(timeout) {
  if (timeout === undefined) return undefined;
  const timeoutMs = Number(timeout);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw Object.assign(new Error('--timeout must be a positive integer in milliseconds.'), { code: 'INVALID_TIMEOUT', exitCode: 2 });
  return timeoutMs;
}
