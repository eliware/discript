import { describe, expect, test } from '@jest/globals';
import { createLanguageBuiltins } from '../../src/language/builtins.mjs';

describe('language builtins', () => {
  const builtins = createLanguageBuiltins({ clock: () => new Date('2030-01-02T03:04:05.000Z') });

  test('measures collections and returns object keys and values', () => {
    expect(builtins.length('abc')).toBe(3);
    expect(builtins.length([1, 2])).toBe(2);
    expect(builtins.keys({ a: 1, b: 2 })).toEqual(['a', 'b']);
    expect(builtins.values({ a: 1, b: 2 })).toEqual([1, 2]);
  });

  test('creates bounded ascending and descending ranges', () => {
    expect(builtins.range(3)).toEqual([0, 1, 2]);
    expect(builtins.range(2, 7, 2)).toEqual([2, 4, 6]);
    expect(builtins.range(5, 0, -2)).toEqual([5, 3, 1]);
  });

  test('returns deterministic time through the injected clock', () => {
    expect(builtins.now()).toBe('2030-01-02T03:04:05.000Z');
  });

  test('rejects invalid inputs and oversized ranges', () => {
    expect(() => builtins.length(1)).toThrow(expect.objectContaining({ code: 'INVALID_ARGUMENT' }));
    expect(() => builtins.keys(1)).toThrow(expect.objectContaining({ code: 'INVALID_ARGUMENT' }));
    expect(() => builtins.range(0, 1, 0)).toThrow(expect.objectContaining({ code: 'INVALID_ARGUMENT' }));
    expect(() => builtins.range(0, 20001)).toThrow(expect.objectContaining({ code: 'LOOP_LIMIT' }));
  });
});
