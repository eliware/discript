import { evaluate } from '../src/evaluator.mjs';
import { parse } from '../src/parser.mjs';

describe('callbacks', () => {
  test('evaluates arrow callbacks with lexical binding', async () => {
    const result = await evaluate(parse('map([1, 2, 3], item => item * 2)'), {
      map: async (items, callback) => Promise.all(items.map(item => callback(item))),
    });
    expect(result).toEqual([2, 4, 6]);
  });

  test('supports callback blocks and async filter/reduce helpers', async () => {
    const result = await evaluate(parse('filter([1, 2, 3], item => { item > 1 })'), {
      filter: async (items, callback) => (await Promise.all(items.map(async item => [item, await callback(item)]))).filter(([, keep]) => keep).map(([item]) => item),
    });
    expect(result).toEqual([2, 3]);
    expect(() => parse('map([1], (item) => item)')).toThrow(expect.objectContaining({ code: 'PARSE_ERROR' }));
  });
});
