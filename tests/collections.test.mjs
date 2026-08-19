import { describe, expect, test } from '@jest/globals';
import { evaluate } from '../src/evaluator.mjs';
import { parse } from '../src/parser.mjs';

describe('collection helpers', () => {
  test('finds a matching structured value', async () => {
    await expect(evaluate(parse('find(items, "name", "two")'), {
      items: [{ name: 'one' }, { name: 'two' }],
      find: (items, property, value) => items.find(item => item[property] === value),
    })).resolves.toEqual({ name: 'two' });
  });
});
