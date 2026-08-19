import { describe, expect, jest, test } from '@jest/globals';
import { isRetryableGatewayError, withGatewayRetry } from '../src/gateway-retry.mjs';

describe('Gateway retry policy', () => {
  test('retries transient startup failures and honors reset delay', async () => {
    const operation = jest.fn().mockRejectedValueOnce(Object.assign(new Error('limited'), { code: 'GATEWAY_SESSION_LIMIT', resetAfter: 1000 })).mockResolvedValue('ok');
    const sleepFn = jest.fn(async () => undefined);
    await expect(withGatewayRetry(operation, { attempts: 2, baseDelay: 10, maxDelay: 2000, sleepFn })).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
    expect(sleepFn).toHaveBeenCalledWith(1000);
  });

  test('does not retry authentication or intent errors', async () => {
    expect(isRetryableGatewayError({ code: 'DISCORD_TOKEN_MISSING' })).toBe(false);
    await expect(withGatewayRetry(async () => { throw Object.assign(new Error('bad intent'), { closeCode: 4014 }); }, { sleepFn: jest.fn() })).rejects.toMatchObject({ closeCode: 4014 });
  });
});
