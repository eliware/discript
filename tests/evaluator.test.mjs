import { describe, expect, test, jest } from '@jest/globals';
import { writeFile, readFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { evaluate, ScriptExit } from '../src/evaluator.mjs';
import { parse } from '../src/parser.mjs';

const program = body => ({ type: 'Program', body });
const expr = type => ({ type });

describe('evaluate', () => {
  test('passes values between statements', async () => {
    await expect(evaluate(parse('value = source.get(); value'), {
      source: { get: () => ({ id: '123' }) },
    })).resolves.toEqual({ id: '123' });
  });

  test('supports asynchronous calls', async () => {
    await expect(evaluate(parse('source.get()'), {
      source: { get: async () => 'ready' },
    })).resolves.toBe('ready');
  });

  test('supports explicit await expressions', async () => {
    await expect(evaluate(parse('await source.get()'), {
      source: { get: async () => 'ready' },
    })).resolves.toBe('ready');
  });

  test('evaluates unary expressions', async () => {
    await expect(evaluate(parse('value = -4; !false; value'))).resolves.toBe(-4);
  });

  test('respects arithmetic precedence and short-circuits logic', async () => {
    await expect(evaluate(parse('value = 2 + 3 * 4; value'))).resolves.toBe(14);
    await expect(evaluate(parse('false && missing; true || missing'))).resolves.toBe(true);
  });

  test('handles imports, events, timers, and return signals', async () => {
    const on = jest.fn((name, handler) => handler({ id: 'event-1' }));
    const every = jest.fn((delay, handler) => handler());
    const after = jest.fn((delay, handler) => handler());
    await expect(evaluate(program([
      { type: 'ImportStatement', path: './shared.ds' },
      { type: 'EventStatement', event: 'ready', body: [{ type: 'ExpressionStatement', expression: { type: 'Identifier', name: 'event' } }] },
      { type: 'EveryStatement', delay: { type: 'Literal', value: 1 }, body: [] },
      { type: 'AfterStatement', delay: { type: 'Literal', value: 2 }, body: [] },
      { type: 'FunctionDeclaration', name: 'answer', parameters: [], body: [{ type: 'ReturnStatement', value: null }] },
    ]), { importScript: jest.fn(), on, every, after })).resolves.toEqual(expect.any(Function));
    expect(on).toHaveBeenCalled();
  });

  test('rejects unavailable integrations and malformed loops', async () => {
    await expect(evaluate(program([{ type: 'ImportStatement', path: 'x' }]))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
    await expect(evaluate(program([{ type: 'EventStatement', event: 'x', body: [] }]))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
    await expect(evaluate(program([{ type: 'EveryStatement', delay: { type: 'Literal', value: 1 }, body: [] }]))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
    await expect(evaluate(program([{ type: 'ForInStatement', binding: 'x', iterable: { type: 'Literal', value: 1 }, body: [] }]))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
    await expect(evaluate(program([{ type: 'ForInStatement', binding: 'x', iterable: { type: 'ArrayExpression', elements: [] }, body: [] }]))).resolves.toBeUndefined();
    await expect(evaluate(program([{ type: 'ForInStatement', binding: 'x', iterable: { type: 'ObjectExpression', properties: [] }, body: [] }]))).resolves.toBeUndefined();
    await expect(evaluate(program([{ type: 'ForInStatement', binding: 'x', iterable: { type: 'ArrayExpression', elements: [{ type: 'Literal', value: 1 }] }, body: [{ type: 'Assignment', name: 'seen', value: { type: 'Identifier', name: 'x' } }] }]))).resolves.toBe(1);
    await expect(evaluate(program([{ type: 'FunctionDeclaration', name: 'broken', parameters: [], body: [{ type: 'UnknownStatement' }] }, { type: 'ExpressionStatement', expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'broken' }, arguments: [] } }]))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
  });

  test('covers unsupported AST operations and callable failures', async () => {
    await expect(evaluate(program([{ type: 'UnknownStatement' }]))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
    await expect(evaluate(program([{ type: 'ExpressionStatement', expression: expr('UnknownExpression') }]))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
    await expect(evaluate(program([{ type: 'ExpressionStatement', expression: { type: 'UnaryExpression', operator: '+', argument: { type: 'Literal', value: 1 } } }]))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
    await expect(evaluate(program([{ type: 'ExpressionStatement', expression: { type: 'BinaryExpression', operator: '%', left: { type: 'Literal', value: 1 }, right: { type: 'Literal', value: 1 } } }]))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
    await expect(evaluate(program([{ type: 'ExpressionStatement', expression: { type: 'CallExpression', callee: { type: 'Literal', value: 1 }, arguments: [] } }]))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
    await expect(evaluate(program([{ type: 'ExpressionStatement', expression: { type: 'Identifier', name: 'missing' } }]))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
  });

  test('evaluates every binary operator and error normalization variant', async () => {
    const expressions = ['==', '!=', '>', '<', '>=', '<=', '+', '-', '*', '/'];
    for (const operator of expressions) {
      await expect(evaluate(program([{ type: 'ExpressionStatement', expression: { type: 'BinaryExpression', operator, left: { type: 'Literal', value: 2 }, right: { type: 'Literal', value: 2 } } }]))).resolves.toBeDefined();
    }
    await expect(evaluate(program([{ type: 'IfStatement', test: { type: 'Literal', value: false }, consequent: [], alternate: null }]))).resolves.toBeUndefined();
    await expect(evaluate(program([{ type: 'WhileStatement', test: { type: 'Literal', value: false }, body: [] }]))).resolves.toBeUndefined();
    await expect(evaluate(program([{ type: 'ExpressionStatement', expression: { type: 'TryExpression', body: [{ type: 'ExpressionStatement', expression: expr('bad') }], binding: 'error', handler: [] } }]))).resolves.toMatchObject({ ok: false });
    await expect(evaluate(program([{ type: 'ExpressionStatement', expression: { type: 'TryExpression', body: [{ type: 'ExpressionStatement', expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'fail' }, arguments: [] } }], binding: 'error', handler: [] } }]), { fail: () => { throw {}; } })).resolves.toMatchObject({ ok: false, error: { code: 'DISCRIPT_ERROR', exitCode: 1 } });
    expect(new ScriptExit()).toMatchObject({ code: 'SCRIPT_EXIT', exitCode: 0 });
    expect(new ScriptExit(2)).toMatchObject({ code: 'SCRIPT_EXIT', exitCode: 2 });
    const iterable = { values: () => new Set([1]) };
    await expect(evaluate(program([{ type: 'ForInStatement', binding: 'x', iterable: { type: 'Identifier', name: 'iterable' }, body: [{ type: 'Assignment', name: 'seen', value: { type: 'Identifier', name: 'x' } }] }]), { iterable })).resolves.toBe(1);
  });
});


describe('callbacks', () => {
  test('evaluates arrow callbacks with lexical binding', async () => {
    const result = await evaluate(parse('map([1, 2, 3], item => item * 2)'), {
      map: async (items, callback) => Promise.all(items.map(item => callback(item))),
    });
    expect(result).toEqual([2, 4, 6]);
  });

  test('supports callback blocks and async filter/reduce helpers', async () => {
    const result = await evaluate(parse('filter([1, 2, 3], item => { item > 1 })'), {
      filter: async (items, callback) => (await Promise.all(items.map(async item => [item, await callback(item)]))).filter(([, keep]) => keep).map(([item]) => item),
    });
    expect(result).toEqual([2, 3]);
    await expect(evaluate(parse('map([1], (item) => item)'), {
      map: async (items, callback) => Promise.all(items.map(item => callback(item))),
    })).resolves.toEqual([1]);
  });

  test('isolates callback bindings during concurrent async work', async () => {
    const result = await evaluate(parse('map([1, 2], item => source.delayed(item))'), {
      map: async (items, callback) => Promise.all(items.map(item => callback(item))),
      source: { delayed: async item => new Promise(resolve => setTimeout(() => resolve(item), item === 1 ? 10 : 0)) },
    });
    expect(result).toEqual([1, 2]);
  });
});


describe('collection helpers', () => {
  test('finds a matching structured value', async () => {
    await expect(evaluate(parse('find(items, "name", "two")'), {
      items: [{ name: 'one' }, { name: 'two' }],
      find: (items, property, value) => items.find(item => item[property] === value),
    })).resolves.toEqual({ name: 'two' });
  });
});


describe('control flow', () => {
  test('evaluates an if/else statement', async () => {
    await expect(evaluate(parse('value = 2; if (value > 1) { result = "yes" } else { result = "no" }; result'))).resolves.toBe('yes');
  });

  test('evaluates else-if branches', async () => {
    await expect(evaluate(parse('value = 2; if (value == 1) { result = "one" } else if (value == 2) { result = "two" } else { result = "other" }; result'))).resolves.toBe('two');
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


describe('for-in loops', () => {
  test('iterates arrays and exposes the binding', async () => {
    await expect(evaluate(parse('total = 0; for (item in [1, 2, 3]) { total = total + item }; total'))).resolves.toBe(6);
  });

  test('iterates object values and rejects non-collections', async () => {
    await expect(evaluate(parse('total = 0; for (item in {a: 2, b: 4}) { total = total + item }; total'))).resolves.toBe(6);
    await expect(evaluate(parse('for (item in 1) {}'))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
  });
});


describe('functions', () => {
  test('declares functions with parameters and return values', async () => {
    await expect(evaluate(parse('fn double(value) { return value * 2 }; double(4)'))).resolves.toBe(8);
  });

  test('supports multi-step function bodies and local parameter restoration', async () => {
    await expect(evaluate(parse('value = 10; fn add(value, amount) { result = value + amount; return result }; total = add(3, 4); value'))).resolves.toBe(10);
  });
});


describe('script imports', () => {
  test('loads source into the caller scope', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'discript-import-'));
    try {
      await writeFile(join(directory, 'shared.ds'), 'fn triple(value) { return value * 3 }');
      const result = await evaluate(parse('import "shared.ds"; triple(7)'), {}, {
        scope: new Map([
          ['importScript', async (path, scope) => evaluate(parse(await readFile(join(directory, path), 'utf8')), {}, { scope })],
        ]),
      });
      expect(result).toBe(21);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  test('rejects imports without a loader', async () => {
    await expect(evaluate(parse('import "shared.ds"'))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
  });

  test('resolves nested imports relative to each importing file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'discript-nested-import-'));
    try {
      await mkdir(join(directory, 'nested'));
      await writeFile(join(directory, 'shared.ds'), 'fn triple(value) { return value * 3 }');
      await writeFile(join(directory, 'nested', 'entry.ds'), 'import "../shared.ds";');
      const load = async (path, scope, baseDir) => {
        const importedPath = resolve(baseDir, path);
        return evaluate(parse(await readFile(importedPath, 'utf8')), {}, { scope, baseDir: dirname(importedPath) });
      };
      await expect(evaluate(parse('import "nested/entry.ds"; triple(7)'), {}, { baseDir: directory, scope: new Map([['importScript', load]]) })).resolves.toBe(21);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});


describe('core language contract', () => {
  test('combines comments, grouped expressions, precedence, logical operators, and else-if', async () => {
    const source = `
      // choose the middle branch
      value = 2 + 3 * 4;
      if (value == (14) && true) { result = "ready" }
      else if (value == 14) { result = "fallback" }
      else { result = "invalid" }
      result
    `;
    await expect(evaluate(parse(source))).resolves.toBe('ready');
  });

  test('combines explicit await with a callback', async () => {
    await expect(evaluate(parse('map([1, 2], (item) => await source.double(item))'), {
      map: async (items, callback) => {
        const results = [];
        for (const item of items) results.push(await callback(item));
        return results;
      },
      source: { double: async item => item * 2 },
    })).resolves.toEqual([2, 4]);
  });
});


describe('loops', () => {
  test('evaluates bounded while loops', async () => {
    await expect(evaluate(parse('count = 0; while (count < 3) { count = count + 1 }; count'))).resolves.toBe(3);
  });
});


describe('script status protocol', () => {
  test('supports explicit script exit codes', async () => {
    await expect(evaluate(parse('exit(10, "missing")'), {
      exit: (code, message) => { throw new ScriptExit(code, message); },
      })).rejects.toMatchObject({ code: 'SCRIPT_EXIT', exitCode: 10, details: { message: 'missing' } });
  });

  test('does not turn explicit exit into a recoverable operation failure', async () => {
    await expect(evaluate(parse('try { exit(12, "stop") } catch (error) { print(error) }'), {
      exit: (code, message) => { throw new ScriptExit(code, message); },
      print: jest.fn(),
    })).rejects.toMatchObject({ code: 'SCRIPT_EXIT', exitCode: 12, details: { message: 'stop' } });
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


describe('try expressions', () => {
  test('capture failures as normalized results', async () => {
    await expect(evaluate(parse('result = try { missing() } catch (error) { error }; result'))).resolves.toMatchObject({
      ok: false,
      exitCode: 1,
      error: { code: 'RUNTIME_ERROR' },
    });
  });

  test('return successful results', async () => {
    await expect(evaluate(parse('result = try { value } catch (error) { error }; result'), { value: 'ok' })).resolves.toEqual({ ok: true, exitCode: 0, value: 'ok' });
  });
});
