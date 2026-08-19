import { mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export function gatewayLockPath(token, directory = tmpdir()) {
  const digest = createHash('sha256').update(String(token)).digest('hex').slice(0, 24);
  return join(directory, `discript-gateway-${digest}.lock`);
}

export async function acquireGatewayIdentifyLock({ token, directory = tmpdir(), wait = 30000, poll = 100 } = {}) {
  const path = gatewayLockPath(token, directory);
  const deadline = Date.now() + wait;
  while (true) {
    try {
      await mkdir(path);
      let released = false;
      return {
        path,
        async release() {
          if (released) return;
          released = true;
          await rm(path, { recursive: true, force: true });
        },
      };
    } catch (error) {
      if (error.code !== 'EEXIST' || Date.now() >= deadline) {
        throw Object.assign(new Error(`Timed out waiting for the Discord Gateway startup lock after ${wait}ms.`), { code: 'GATEWAY_STARTUP_LOCK_TIMEOUT', exitCode: 6, cause: error });
      }
      await sleep(Math.min(poll, Math.max(1, deadline - Date.now())));
    }
  }
}
