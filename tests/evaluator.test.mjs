import { describe, expect, test } from '@jest/globals';
import { evaluate } from '../src/evaluator.mjs';
import { parse } from '../src/parser.mjs';

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

  test('evaluates unary expressions', async () => {
    await expect(evaluate(parse('value = -4; !false; value'))).resolves.toBe(-4);
  });

  test('respects arithmetic precedence and short-circuits logic', async () => {
    await expect(evaluate(parse('value = 2 + 3 * 4; value'))).resolves.toBe(14);
    await expect(evaluate(parse('false && missing; true || missing'))).resolves.toBe(true);
  });
});
