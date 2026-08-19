import { describe, expect, jest, test } from '@jest/globals';

import { evaluate } from '../../src/evaluator.mjs';

import { parse } from '../../src/parser.mjs';
import { createStatementEvaluator } from '../../src/evaluator/control-flow.mjs';




describe('control flow', () => {
  test('evaluates an if/else statement', async () => {
    await expect(evaluate(parse('value = 2; if (value > 1) { result = "yes" } else { result = "no" }; result'))).resolves.toBe('yes');
  });

  test('evaluates else-if branches', async () => {
    await expect(evaluate(parse('value = 2; if (value == 1) { result = "one" } else if (value == 2) { result = "two" } else { result = "other" }; result'))).resolves.toBe('two');
  });
});

describe('for-in loops', () => {
  test('iterates arrays and exposes the binding', async () => {
    await expect(evaluate(parse('total = 0; for (item in [1, 2, 3]) { total = total + item }; total'))).resolves.toBe(6);
  });

  test('iterates object values and rejects non-collections', async () => {
    await expect(evaluate(parse('total = 0; for (item in {a: 2, b: 4}) { total = total + item }; total'))).resolves.toBe(6);
    await expect(evaluate(parse('for (item in 1) {}'))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
  });
});

describe('loops', () => {
  test('evaluates bounded while loops', async () => {
    await expect(evaluate(parse('count = 0; while (count < 3) { count = count + 1 }; count'))).resolves.toBe(3);
  });

  test('returns undefined from an empty return statement', async () => {
    class ReturnSignal extends Error {}
    const evaluateStatement = createStatementEvaluator({
      scope: new Map(), scopeContext: { run: (_scope, callback) => callback() },
      evaluateBlock: async () => undefined, evaluateExpression: async () => undefined,
      runtimeError: message => new Error(message), ReturnSignal,
      createClosure: () => undefined, baseDir: process.cwd(),
    });
    await expect(evaluateStatement({ type: 'ReturnStatement', value: null })).rejects.toBeInstanceOf(ReturnSignal);
  });

  test('rejects runaway while loops', async () => {
    await expect(evaluate(parse('while (true) {}'))).rejects.toMatchObject({ code: 'LOOP_LIMIT' });
  });

  test('rejects collections larger than the loop limit', async () => {
    const values = Array.from({ length: 10001 }, () => 1);
    await expect(evaluate(parse('for (item in values) {}'), { values })).rejects.toMatchObject({ code: 'LOOP_LIMIT' });
  });
});

describe('event declarations', () => {
  test('register a handler and bind each payload as event', async () => {
    const handlers = new Map();
    const on = jest.fn((name, handler) => { handlers.set(name, handler); return { event: name, registered: true }; });
    const print = jest.fn(value => value);
    const result = await evaluate(parse('on("messageCreate") { print(event.content) }'), { on, print });
    expect(result).toEqual({ event: 'messageCreate', registered: true });
    expect(on).toHaveBeenCalledWith('messageCreate', expect.any(Function));
    await handlers.get('messageCreate')({ content: 'hello' });
    expect(print).toHaveBeenCalledWith('hello');
  });

  test('rejects event declarations when registration is unavailable', async () => {
    await expect(evaluate(parse('on("ready") {}'))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
  });
});

describe('timers and async helpers', () => {
  test('registers recurring and one-shot timers', async () => {
    const timers = [];
    const result = await evaluate(parse('every(100) {}; after(250) {}'), {
      every: (delay, callback) => { timers.push(['every', delay, callback]); return { registered: true }; },
      after: (delay, callback) => { timers.push(['after', delay, callback]); return { registered: true }; },
    });
    expect(result).toEqual({ registered: true });
    expect(timers.map(timer => timer.slice(0, 2))).toEqual([['every', 100], ['after', 250]]);
  });

  test('supports sleep and parallel operations', async () => {
    const started = Date.now();
    const result = await evaluate(parse('parallel(sleep(5), sleep(5))'), {
      sleep: delay => new Promise(resolve => setTimeout(() => resolve(delay), delay)),
      parallel: (...operations) => Promise.all(operations),
    });
    expect(result).toEqual([5, 5]);
    expect(Date.now() - started).toBeLessThan(50);
  });
});
