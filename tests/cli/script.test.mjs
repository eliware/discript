import { describe, expect, jest, test } from '@jest/globals';
import { EventEmitter } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

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

  test('exposes hierarchical capability introspection to scripts', async () => {
    const active = runtime();
    await expect(executeInput({ kind: 'source', source: '{write: capabilities.has("discord:write"), read: capabilities.has("discord:read"), admin: capabilities.has("discord:admin")}' }, {}, { runtime: active, capabilities: ['discord:admin'] })).resolves.toEqual({ write: true, read: true, admin: true });
  });

  test('treats an empty capability list as the default unrestricted policy', async () => {
    const active = runtime();
    await expect(executeInput({ kind: 'source', source: '{read: capabilities.has("discord:read"), write: capabilities.has("discord:write"), admin: capabilities.has("discord:admin")}' }, {}, { runtime: active, capabilities: [] })).resolves.toEqual({ read: true, write: true, admin: true });
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

  test('runs deferred callbacks in reverse order during cleanup', async () => {
    const output = [];
    await expect(executeInput({ kind: 'source', source: 'fn first() { print("first") }; fn second() { print("second") }; defer first; defer second; 1' }, {}, { runtime: runtime(), stdout: value => output.push(value) })).resolves.toBe(1);
    expect(output).toEqual(['second', 'first']);
  });

  test('runs deferred callbacks when evaluation throws', async () => {
    const output = [];
    await expect(executeInput({ kind: 'source', source: 'fn cleanup() { print("cleanup") }; defer cleanup; throw "failure"' }, {}, { runtime: runtime(), stdout: value => output.push(value) })).rejects.toMatchObject({ code: 'SCRIPT_THROW' });
    expect(output).toEqual(['cleanup']);
  });

  test('cancels individual timers and event handlers', async () => {
    const active = runtime();
    await expect(executeInput({ kind: 'source', source: 'timer = every(10, () => print("tick")); timer.cancel(); listener = on("ready", () => print("ready")); listener.cancel()' }, { keep_alive: false }, { runtime: active, stdout: () => {} })).resolves.toBe(true);
    expect(active.client.listenerCount('ready')).toBe(0);
  });

  test('cancels registered timers and handlers when the execution signal aborts', async () => {
    const active = runtime();
    const controller = new AbortController();
    const output = [];
    const execution = executeInput({ kind: 'source', source: 'every(10) { print("tick") }; on("ready") { print("ready") }' }, { keep_alive: true }, { runtime: active, signal: controller.signal, stdout: value => output.push(value) });
    await new Promise(resolve => setImmediate(resolve));
    controller.abort();
    await expect(execution).rejects.toMatchObject({ code: 'EXECUTION_CANCELLED', exitCode: 130 });
    await new Promise(resolve => setTimeout(resolve, 25));
    expect(output).toEqual([]);
    expect(active.client.listenerCount('ready')).toBe(0);
  });

  test('isolates and caches aliased modules while preserving private closure state', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'discript-module-'));
    try {
      const modulePath = join(directory, 'counter.ds');
      const entryPath = join(directory, 'entry.ds');
      await writeFile(modulePath, 'secret = "private"; count = 0; export fn next() { count += 1; return {count: count, secret: secret} }');
      await writeFile(entryPath, 'import first from "./counter.ds"; import second from "./counter.ds"; a = first.next(); b = second.next(); same = first == second; {a: a, b: b, same: same}');
      await expect(executeInput({ kind: 'source', source: await readFile(entryPath, 'utf8'), origin: entryPath }, {}, { runtime: runtime() })).resolves.toEqual({ a: { count: 1, secret: 'private' }, b: { count: 2, secret: 'private' }, same: true });
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});
