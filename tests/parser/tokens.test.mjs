import { describe, expect, test } from '@jest/globals';
import { createTokenStream } from '../../src/parser/tokens.mjs';

describe('parser/tokens', () => {
  test('peeks, matches, consumes, and tracks position', () => {
    const syntaxError = message => new Error(message);
    const stream = createTokenStream([{ type: 'word', value: 'let' }, { type: 'number', value: 3 }]);
    expect(stream.peek()).toEqual({ type: 'word', value: 'let' });
    expect(stream.match('word')).toBe(true);
    expect(stream.previous()).toEqual({ type: 'word', value: 'let' });
    expect(stream.takeValue()).toBe(3);
    expect(stream.atEnd()).toBe(true);
    expect(() => stream.consume('missing', 'expected token', syntaxError)).toThrow('expected token');
  });

  test('matches by value and consumes matching tokens', () => {
    const stream = createTokenStream([{ type: 'operator', value: '+' }]);
    expect(stream.match('+')).toBe(true);
    expect(stream.take()).toBeUndefined();
  });
});
