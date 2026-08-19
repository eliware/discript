import { describe, expect, test } from '@jest/globals';
import { evaluate } from '../src/evaluator.mjs';
import { parse } from '../src/parser.mjs';

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
