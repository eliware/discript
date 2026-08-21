import { describe, expect, test } from '@jest/globals';
import { EventEmitter } from 'node:events';

const { executeInput } = await import('../../src/cli/script.mjs');

function runtime() {
  const client = new EventEmitter();
  return { client, waitForStop: () => new Promise(() => {}), shutdown: async () => {} };
}

describe('cli/script', () => {
  test('module loads', async () => {
    await expect(import('../../src/cli/script.mjs')).resolves.toBeDefined();
  });

  test('finishes event scripts by default when requested by a bounded caller', async () => {
    const active = runtime();
    await expect(executeInput({ kind: 'source', source: 'on("messageCreate") { print(event) }' }, { keep_alive: false }, { runtime: active, stdout: () => {} })).resolves.toMatchObject({ event: 'messageCreate', registered: true });
    expect(active.client.listenerCount('messageCreate')).toBe(0);
  });

  test('cancels a retained event script and removes its handlers', async () => {
    const active = runtime();
    const controller = new AbortController();
    const execution = executeInput({ kind: 'source', source: 'on("messageCreate") { print(event) }' }, { keep_alive: true }, { runtime: active, signal: controller.signal, stdout: () => {} });
    await new Promise(resolve => setImmediate(resolve));
    controller.abort();
    await expect(execution).rejects.toMatchObject({ code: 'EXECUTION_CANCELLED', exitCode: 130 });
    expect(active.client.listenerCount('messageCreate')).toBe(0);
  });
});
