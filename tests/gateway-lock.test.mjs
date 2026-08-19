import { describe, expect, test } from '@jest/globals';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { acquireGatewayIdentifyLock, gatewayLockPath } from '../src/gateway-lock.mjs';

describe('Gateway startup lock', () => {
  test('serializes acquisition and releases idempotently', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'discript-lock-'));
    try {
      const first = await acquireGatewayIdentifyLock({ token: 'token', directory, wait: 10 });
      await expect(acquireGatewayIdentifyLock({ token: 'token', directory, wait: 5, poll: 1 })).rejects.toMatchObject({ code: 'GATEWAY_STARTUP_LOCK_TIMEOUT', exitCode: 6 });
      await first.release();
      await first.release();
      const second = await acquireGatewayIdentifyLock({ token: 'token', directory, wait: 10 });
      await second.release();
    } finally { await rm(directory, { recursive: true, force: true }); }
  });

  test('does not include the token in the lock path', () => {
    expect(gatewayLockPath('secret-token')).not.toContain('secret-token');
  });
});
