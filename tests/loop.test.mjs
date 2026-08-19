import { describe, expect, test } from '@jest/globals';
import { evaluate } from '../src/evaluator.mjs';
import { parse } from '../src/parser.mjs';

describe('loops', () => {
  test('evaluates bounded while loops', async () => {
    await expect(evaluate(parse('count = 0; while (count < 3) { count = count + 1 }; count'))).resolves.toBe(3);
  });
});
