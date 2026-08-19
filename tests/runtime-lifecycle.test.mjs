import { EventEmitter } from 'node:events';
import { describe, expect, jest, test } from '@jest/globals';
import { createDiscordRuntime } from '../src/runtime.mjs';

function clientFixture() {
  const client = new EventEmitter();
  client.login = async () => { queueMicrotask(() => client.emit('clientReady')); return 'token'; };
  client.destroy = jest.fn(async () => undefined);
  return client;
}

describe('Discord runtime lifecycle', () => {
  test('logs in, exposes a stop promise, and destroys the client once', async () => {
    const client = clientFixture();
    const runtime = await createDiscordRuntime({ token: 'test-token', client });
    expect(runtime.client).toBe(client);
    const stopped = runtime.waitForStop();
    await runtime.shutdown();
    await expect(stopped).resolves.toBeUndefined();
    await runtime.shutdown();
    expect(client.destroy).toHaveBeenCalledTimes(1);
  });

  test('rejects when no token is configured', async () => {
    await expect(createDiscordRuntime({ token: '' })).rejects.toMatchObject({ code: 'DISCORD_TOKEN_MISSING', exitCode: 4 });
  });

  test('rejects login errors and removes temporary listeners', async () => {
    const client = new EventEmitter();
    client.login = async () => { throw Object.assign(new Error('login failed'), { code: 'LOGIN_FAILED' }); };
    await expect(createDiscordRuntime({ token: 'test-token', client })).rejects.toMatchObject({ code: 'LOGIN_FAILED' });
    expect(client.listenerCount('clientReady')).toBe(0);
    expect(client.listenerCount('error')).toBe(0);
  });

  test('rejects a login that does not become ready before the timeout', async () => {
    const client = new EventEmitter();
    client.login = async () => 'pending';
    await expect(createDiscordRuntime({ token: 'test-token', client, loginTimeout: 1 })).rejects.toMatchObject({ code: 'DISCORD_LOGIN_TIMEOUT', exitCode: 4 });
    expect(client.listenerCount('clientReady')).toBe(0);
    expect(client.listenerCount('error')).toBe(0);
  });

  test('normalizes synchronous login failures and removes temporary listeners', async () => {
    const client = new EventEmitter();
    client.login = () => { throw Object.assign(new Error('sync login failed'), { code: 'LOGIN_FAILED_SYNC' }); };
    await expect(createDiscordRuntime({ token: 'test-token', client })).rejects.toMatchObject({ code: 'LOGIN_FAILED_SYNC' });
    expect(client.listenerCount('clientReady')).toBe(0);
    expect(client.listenerCount('error')).toBe(0);
  });
});
