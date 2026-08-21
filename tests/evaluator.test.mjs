import { describe, expect, test, jest } from '@jest/globals';
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

  test('evaluates nested statements through the statement callback', async () => {
    await expect(evaluate(parse('if (true) { value = 42 }; value'))).resolves.toBe(42);
    await expect(evaluate(parse('if (false) { value = 0 } else if (true) { value = 43 }; value'))).resolves.toBe(43);
  });

  test('supports environment globals supplied by the host', async () => {
    const values = {};
    const env = (await import('../src/env.mjs')).createEnvironment(values);
    await expect(evaluate(parse('env.set("DISCRIPT_TEST", "ok"); env.DISCRIPT_TEST'), { env })).resolves.toBe('ok');
    expect(values.DISCRIPT_TEST).toBe('ok');
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
    await expect(evaluate(program([{ type: 'ExpressionStatement', expression: { type: 'BinaryExpression', operator: '%', left: { type: 'Literal', value: 5 }, right: { type: 'Literal', value: 2 } } }]))).resolves.toBe(1);
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

  test('supports break and continue in loops', async () => {
    await expect(evaluate(parse('values = [1, 2, 3, 4]; total = 0; for (value in values) { if (value == 2) { continue } if (value == 4) { break } total = total + value }; total'))).resolves.toBe(4);
  });

  test('throws script values and catches them with finally cleanup', async () => {
    await expect(evaluate(parse('result = try { throw "bad" } catch (error) { error.message } finally { cleaned = true }; result'))).resolves.toEqual({ ok: false, exitCode: 1, error: { code: 'SCRIPT_THROW', message: 'bad', exitCode: 1 } });
  });

  test('runs finally when a try body succeeds', async () => {
    await expect(evaluate(parse('result = try { 7 } catch (error) { 0 } finally { 9 }; result'))).resolves.toEqual({ ok: true, exitCode: 0, value: 7 });
  });
});
