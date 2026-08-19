import { describe, expect, test } from '@jest/globals';
import { evaluate } from '../src/evaluator.mjs';
import { parse } from '../src/parser.mjs';

describe('control flow', () => {
  test('evaluates an if/else statement', async () => {
    await expect(evaluate(parse('value = 2; if (value > 1) { result = "yes" } else { result = "no" }; result'))).resolves.toBe('yes');
  });
});
