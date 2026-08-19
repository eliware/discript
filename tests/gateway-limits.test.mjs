import { describe, expect, jest, test } from '@jest/globals';
import { getGatewaySessionLimits, shouldWaitForGatewayStart } from '../src/gateway-limits.mjs';

describe('Gateway session limits', () => {
  test('normalizes Discord session-start metadata', async () => {
    const request = jest.fn(async () => ({ shards: 2, session_start_limit: { total: 1000, remaining: 9, reset_after: 5000, max_concurrency: 2 } }));
    await expect(getGatewaySessionLimits({ rest: { request } })).resolves.toEqual({ total: 1000, remaining: 9, resetAfter: 5000, maxConcurrency: 2, shards: 2 });
    expect(request).toHaveBeenCalledWith('/gateway/bot');
  });
  test('identifies exhausted session starts', () => {
    expect(shouldWaitForGatewayStart({ remaining: 0 })).toBe(true);
    expect(shouldWaitForGatewayStart({ remaining: 1 })).toBe(false);
  });
});
