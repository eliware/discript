import { describe, expect, jest, test } from '@jest/globals';
import { EventEmitter } from 'node:events';
import { platform, tmpdir } from 'node:os';
import { brokerEndpoint, brokerRequest, startGatewayBroker } from '../src/broker.mjs';

describe('Gateway broker', () => {
  test('uses a stable secret-free endpoint', () => {
    expect(brokerEndpoint('secret', '/tmp', 'linux')).toMatch(/^\/tmp\/\.discript-[a-f0-9]+\.sock$/);
    expect(brokerEndpoint('secret', '/tmp', 'win32')).toMatch(/^\\\\\.\\pipe\\discript-[a-f0-9]+$/);
  });

  test('reports status and shuts down through IPC', async () => {
    const endpoint = brokerEndpoint('test', tmpdir(), platform());
    const client = new EventEmitter();
    const onClose = jest.fn(async () => undefined);
    client.login = async () => queueMicrotask(() => client.emit('clientReady'));
    client.isReady = () => true;
    client.destroy = jest.fn(async () => undefined);
    const broker = await startGatewayBroker({ token: 'test', endpoint, runtimeOptions: { client }, limits: { remaining: 1, resetAfter: 0 }, onClose });
    await expect(startGatewayBroker({ token: 'test', endpoint, runtimeOptions: { client }, limits: { remaining: 1, resetAfter: 0 } })).rejects.toMatchObject({ code: 'BROKER_ALREADY_RUNNING', exitCode: 1 });
    await expect(brokerRequest({ token: 'test', endpoint, method: 'status' })).resolves.toEqual({ ok: true, ready: true });
    await expect(brokerRequest({ token: 'test', endpoint, method: 'command', command: ['unknown'] })).resolves.toMatchObject({ ok: false, code: 'UNKNOWN_COMMAND', exitCode: 2 });
    await expect(brokerRequest({ token: 'test', endpoint, method: 'script', source: '7', options: {} })).resolves.toMatchObject({ ok: true, value: 7 });
    await expect(brokerRequest({ token: 'test', endpoint, method: 'shutdown' })).resolves.toEqual({ ok: true });
    expect(onClose).toHaveBeenCalledTimes(1);
    await Promise.all([broker.close(), broker.close(), broker.close()]);
    expect(client.destroy).toHaveBeenCalledTimes(1);
  });

  test('refuses an exhausted session-start budget', async () => {
    await expect(startGatewayBroker({ token: 'test', endpoint: `/tmp/discript-limit-${process.pid}.sock`, limits: { remaining: 0, resetAfter: 1234 } })).rejects.toMatchObject({ code: 'GATEWAY_SESSION_LIMIT', exitCode: 6, resetAfter: 1234 });
  });

  test('serves concurrent executions through one Gateway runtime', async () => {
    const endpoint = brokerEndpoint(`concurrent-${process.pid}`, tmpdir(), platform());
    const client = new EventEmitter();
    client.login = jest.fn(async () => queueMicrotask(() => client.emit('clientReady')));
    client.isReady = () => true;
    client.destroy = jest.fn(async () => undefined);
    const broker = await startGatewayBroker({ token: 'test', endpoint, runtimeOptions: { client }, limits: { remaining: 1, resetAfter: 0 } });
    const results = await Promise.all([
      brokerRequest({ token: 'test', endpoint, method: 'script', source: '1' }),
      brokerRequest({ token: 'test', endpoint, method: 'script', source: '2' }),
    ]);
    expect(results.map(result => result.value)).toEqual([1, 2]);
    expect(new Set(results.map(result => result.requestId)).size).toBe(2);
    expect(client.login).toHaveBeenCalledTimes(1);
    await broker.close();
  });
});
