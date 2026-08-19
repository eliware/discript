import { describe, expect, jest, test } from '@jest/globals';
import { EventEmitter } from 'node:events';
import { brokerEndpoint, brokerRequest, startGatewayBroker } from '../src/broker.mjs';

describe('Gateway broker', () => {
  test('uses a stable secret-free endpoint', () => {
    expect(brokerEndpoint('secret', '/tmp', 'linux')).toMatch(/^\/tmp\/\.discript-[a-f0-9]+\.sock$/);
    expect(brokerEndpoint('secret', '/tmp', 'win32')).toMatch(/^\\\\\.\\pipe\\discript-[a-f0-9]+$/);
  });

  test('reports status and shuts down through IPC', async () => {
    const endpoint = `/tmp/discript-test-${process.pid}.sock`;
    const client = new EventEmitter();
    client.login = async () => queueMicrotask(() => client.emit('clientReady'));
    client.isReady = () => true;
    client.destroy = jest.fn(async () => undefined);
    const broker = await startGatewayBroker({ token: 'test', endpoint, runtimeOptions: { client } });
    await expect(brokerRequest({ token: 'test', endpoint, method: 'status' })).resolves.toEqual({ ok: true, ready: true });
    await expect(brokerRequest({ token: 'test', endpoint, method: 'shutdown' })).resolves.toEqual({ ok: true });
    await broker.close();
  });
});
