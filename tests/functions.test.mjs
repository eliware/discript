import { evaluate } from '../src/evaluator.mjs';
import { parse } from '../src/parser.mjs';

describe('functions', () => {
  test('declares functions with parameters and return values', async () => {
    await expect(evaluate(parse('fn double(value) { return value * 2 }; double(4)'))).resolves.toBe(8);
  });

  test('supports multi-step function bodies and local parameter restoration', async () => {
    await expect(evaluate(parse('value = 10; fn add(value, amount) { result = value + amount; return result }; total = add(3, 4); value'))).resolves.toBe(10);
  });
});
