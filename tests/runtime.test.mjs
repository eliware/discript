import { EventEmitter } from 'node:events';
import { describe, expect, jest, test } from '@jest/globals';
import { createDiscordRuntime } from '../src/runtime.mjs';

describe('Discord runtime lifecycle', () => {
  test('rejects missing tokens before constructing a client', async () => {
    await expect(createDiscordRuntime({ token: '' })).rejects.toMatchObject({ code: 'DISCORD_TOKEN_MISSING', exitCode: 4 });
  });

  test('starts, signals stop, and shuts down idempotently', async () => {
    const client = new EventEmitter();
    client.login = jest.fn(async () => { queueMicrotask(() => client.emit('clientReady')); });
    client.destroy = jest.fn(async () => undefined);
    const runtime = await createDiscordRuntime({ token: 'test-token', client });
    expect(client.login).toHaveBeenCalledWith('test-token');
    const stopped = runtime.waitForStop();
    await runtime.shutdown();
    await expect(stopped).resolves.toBeUndefined();
    await runtime.shutdown();
    expect(client.destroy).toHaveBeenCalledTimes(1);
  });
});
