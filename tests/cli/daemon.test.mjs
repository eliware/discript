import { describe, expect, jest, test } from '@jest/globals';

process.env.DISCORD_TOKEN = 'test-token';

const startGatewayBroker = jest.fn(async () => ({ endpoint: '/tmp/test.sock' }));
const brokerRequest = jest.fn(async () => ({ ok: true, ready: true }));
jest.unstable_mockModule('../../src/broker.mjs', () => ({ startGatewayBroker, brokerRequest }));

const { run } = await import('../../src/cli.mjs');

describe('daemon CLI lifecycle', () => {
  test('starts the Gateway broker', async () => {
    const stdout = jest.fn();
    await run(['daemon', 'start'], { stdout });
    expect(startGatewayBroker).toHaveBeenCalled();
    expect(stdout).toHaveBeenCalledWith({ started: true, endpoint: '/tmp/test.sock' });
  });

  test('proxies status and stop requests', async () => {
    const stdout = jest.fn();
    await run(['daemon', 'status'], { stdout });
    await run(['daemon', 'stop'], { stdout });
    expect(brokerRequest).toHaveBeenCalledTimes(2);
    expect(stdout).toHaveBeenCalledWith({ ok: true, ready: true });
  });
});
