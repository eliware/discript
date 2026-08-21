import { describe, expect, jest, test } from '@jest/globals';
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

  test('exposes supported REST operations under discord.rest in REST mode', async () => {
    const active = runtime();
    const request = jest.fn(async () => [{ id: 'guild-1', name: 'Test Guild' }]);
    await expect(executeInput(
      { kind: 'source', source: 'discord.rest.guilds.list()' },
      { rest: true },
      { runtime: active, token: 'test-token', rest: { request }, stdout: () => {} },
    )).resolves.toEqual([{ id: 'guild-1', name: 'Test Guild' }]);
    expect(request).toHaveBeenCalledWith({ method: 'GET', fullRoute: '/users/@me/guilds' });
  });

  test('returns dry-run source without starting a runtime', async () => {
    await expect(executeInput({ kind: 'source', source: 'discord.guilds.list()' }, { dry_run: true }, { stdout: () => {} })).resolves.toEqual({ dryRun: true, source: 'discord.guilds.list()' });
  });

  test('supports find and property filter helpers', async () => {
    const active = runtime();
    await expect(executeInput({ kind: 'source', source: 'find([{id: "a"}], "id", "a")' }, {}, { runtime: active })).resolves.toEqual({ id: 'a' });
    await expect(executeInput({ kind: 'source', source: 'filter([{ok: true}, {ok: false}], "ok", true)' }, {}, { runtime: active })).resolves.toEqual([{ ok: true }]);
  });

  test('supports async collection helpers', async () => {
    const active = runtime();
    await expect(executeInput({ kind: 'source', source: 'map([1, 2], x => x * 2)' }, {}, { runtime: active })).resolves.toEqual([2, 4]);
    await expect(executeInput({ kind: 'source', source: 'reduce([1, 2, 3], (total, x) => total + x, 0)' }, {}, { runtime: active })).rejects.toMatchObject({ code: 'PARSE_ERROR' });
  });

  test('supports parallel operations', async () => {
    await expect(executeInput({ kind: 'source', source: 'parallel(1, 2)' }, {}, { runtime: runtime() })).resolves.toEqual([1, 2]);
  });

  test('rejects invalid timer delays', async () => {
    await expect(executeInput({ kind: 'source', source: 'after(0) {}' }, {}, { runtime: runtime() })).rejects.toMatchObject({ code: 'INVALID_TIMER', exitCode: 2 });
  });

  test('rejects an already-cancelled execution', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(executeInput({ kind: 'source', source: '1' }, {}, { runtime: runtime(), signal: controller.signal })).rejects.toMatchObject({ code: 'EXECUTION_CANCELLED', exitCode: 130 });
  });

  test('supports one-shot timers when keep-alive is disabled', async () => {
    await expect(executeInput({ kind: 'source', source: 'after(1) {}' }, { keep_alive: false }, { runtime: runtime() })).resolves.toMatchObject({ timer: 'timeout', registered: true });
  });

  test('supports callback filters', async () => {
    await expect(executeInput({ kind: 'source', source: 'filter([1, 2], x => x > 1)' }, {}, { runtime: runtime() })).resolves.toEqual([2]);
  });

  test('cleans up timers after execution', async () => {
    jest.useFakeTimers();
    try { await executeInput({ kind: 'source', source: 'every(10) {}' }, { keep_alive: false }, { runtime: runtime() }); jest.advanceTimersByTime(100); }
    finally { jest.useRealTimers(); }
  });
});
