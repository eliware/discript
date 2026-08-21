import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, jest, test } from '@jest/globals';

const runtimes = [];

jest.unstable_mockModule('../../src/runtime.mjs', () => ({
  createDiscordRuntime: jest.fn(async () => {
    const client = new EventEmitter();
    const runtime = {
      client,
      shutdown: jest.fn(async () => { runtime.stopped = true; }),
      waitForStop: jest.fn(() => new Promise(() => {})),
      stopped: false,
    };
    runtimes.push(runtime);
    return runtime;
  }),
}));

const { run } = await import('../../src/cli.mjs');

afterEach(() => {
  runtimes.length = 0;
});

describe('CLI script runtime integration', () => {
  test('executes inline source and emits JSON output', async () => {
    const output = [];
    const result = await run(['--eval', 'print({ok: true, source: "inline"})', '--json'], { stdout: value => output.push(value), stdin: { isTTY: true } });
    expect(result).toEqual({ ok: true, source: 'inline' });
    expect(output).toEqual(['{\n  "ok": true,\n  "source": "inline"\n}', '{\n  "ok": true,\n  "source": "inline"\n}']);
    expect(runtimes[0].shutdown).toHaveBeenCalled();
  });

  test('executes source from stdin and emits JSONL records', async () => {
    const output = [];
    const stdin = { isTTY: false, async *[Symbol.asyncIterator]() { yield 'print("one"); print("two")'; } };
    const result = await run(['--output', 'jsonl'], { stdout: value => output.push(value), stdin });
    expect(result).toBe('two');
    expect(output).toEqual(['"one"', '"two"', '"two"']);
    expect(runtimes[0].shutdown).toHaveBeenCalled();
  });

  test('executes a source file and resolves its result', async () => {
    const output = [];
    const source = await readFile('examples/fundamentals/hello.ds', 'utf8');
    expect(source).toContain('print');
    const result = await run(['examples/fundamentals/hello.ds', '--json'], { stdout: value => output.push(value), stdin: { isTTY: true } });
    expect(result).toBeDefined();
    expect(output).toHaveLength(2);
    expect(runtimes[0].shutdown).toHaveBeenCalled();
  });

  test('supports runtime helpers and environment access', async () => {
    const output = [];
    const result = await run(['-e', 'env.set("DISCRIPT_TEST_VALUE", "ok"); print({value: env.get("DISCRIPT_TEST_VALUE")})', '--json'], { stdout: value => output.push(value), stdin: { isTTY: true } });
    expect(result).toEqual({ value: 'ok' });
    expect(output).toHaveLength(2);
    delete process.env.DISCRIPT_TEST_VALUE;
  });

  test('supports constrained JSON serialization helpers', async () => {
    const output = [];
    const result = await run(['-e', 'json.parse(json.stringify({name: "discript", ok: true}))', '--json'], { stdout: value => output.push(value), stdin: { isTTY: true } });
    expect(result).toEqual({ name: 'discript', ok: true });
    expect(output.at(-1)).toBe('{\n  "name": "discript",\n  "ok": true\n}');
  });

  test('runs concurrency and delay helpers', async () => {
    const output = [];
    const result = await run(['-e', 'sleep(1); print({parallel: parallel(1, 2)})', '--json'], { stdout: value => output.push(value), stdin: { isTTY: true } });
    expect(result).toEqual({ parallel: [1, 2] });
    expect(output.length).toBeGreaterThanOrEqual(2);
    expect(runtimes[0].shutdown).toHaveBeenCalled();
  });

  test('cleans up the runtime when script evaluation fails', async () => {
    await expect(run(['-e', 'missingFunction()'], { stdout: () => {}, stdin: { isTTY: true } })).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
    expect(runtimes[0].shutdown).toHaveBeenCalled();
  });

  test('returns timeout status and still shuts down long-running scripts', async () => {
    await expect(run(['-e', 'on("messageCreate") { print(event) }', '--timeout', '10'], { stdout: () => {}, stdin: { isTTY: true } })).rejects.toMatchObject({ code: 'EXECUTION_TIMEOUT', exitCode: 6 });
    expect(runtimes[0].shutdown).toHaveBeenCalled();
  });

  test('supports script-level exit codes', async () => {
    await expect(run(['-e', 'exit(12, "needs approval")'], { stdout: () => {}, stdin: { isTTY: true } })).rejects.toMatchObject({ code: 'SCRIPT_EXIT', exitCode: 12, details: { message: 'needs approval' } });
    expect(runtimes[0].shutdown).toHaveBeenCalled();
  });

  test('returns a source preview without connecting when CLI dry-run is used', async () => {
    const output = [];
    const result = await run(['-e', 'print("would run")', '--dry-run', '--json'], { stdout: value => output.push(value), stdin: { isTTY: true } });
    expect(result).toEqual({ dryRun: true, source: 'print("would run")' });
    expect(output).toHaveLength(1);
    expect(runtimes).toHaveLength(0);
  });
});
