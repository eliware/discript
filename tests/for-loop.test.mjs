import { evaluate } from '../src/evaluator.mjs';
import { parse } from '../src/parser.mjs';

describe('for-in loops', () => {
  test('iterates arrays and exposes the binding', async () => {
    await expect(evaluate(parse('total = 0; for (item in [1, 2, 3]) { total = total + item }; total'))).resolves.toBe(6);
  });

  test('iterates object values and rejects non-collections', async () => {
    await expect(evaluate(parse('total = 0; for (item in {a: 2, b: 4}) { total = total + item }; total'))).resolves.toBe(6);
    await expect(evaluate(parse('for (item in 1) {}'))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
  });
});
