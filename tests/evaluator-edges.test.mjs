import { describe, expect, test, jest } from '@jest/globals';
import { evaluate } from '../src/evaluator.mjs';

const program = body => ({ type: 'Program', body });
const expr = type => ({ type });

describe('evaluator edge paths', () => {
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
  });
});
