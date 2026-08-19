import { describe, expect, test } from '@jest/globals';
import { evaluate } from '../../src/evaluator.mjs';

import { parse } from '../../src/parser.mjs';




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
    await expect(evaluate(parse('map([1], (item) => item)'), {
      map: async (items, callback) => Promise.all(items.map(item => callback(item))),
    })).resolves.toEqual([1]);
  });

  test('isolates callback bindings during concurrent async work', async () => {
    const result = await evaluate(parse('map([1, 2], item => source.delayed(item))'), {
      map: async (items, callback) => Promise.all(items.map(item => callback(item))),
      source: { delayed: async item => new Promise(resolve => setTimeout(() => resolve(item), item === 1 ? 10 : 0)) },
    });
    expect(result).toEqual([1, 2]);
  });
});

describe('collection helpers', () => {
  test('finds a matching structured value', async () => {
    await expect(evaluate(parse('find(items, "name", "two")'), {
      items: [{ name: 'one' }, { name: 'two' }],
      find: (items, property, value) => items.find(item => item[property] === value),
    })).resolves.toEqual({ name: 'two' });
  });
});

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
