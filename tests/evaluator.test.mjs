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
});
