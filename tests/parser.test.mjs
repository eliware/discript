import { describe, expect, test } from '@jest/globals';
import { parse, precedence } from '../src/parser.mjs';

describe('parse', () => {
  test('parses assignments and chained calls', () => {
    expect(parse('guilds = discord.guilds.list(); guilds')).toEqual({
      type: 'Program',
      body: [
        {
          type: 'Assignment',
          name: 'guilds',
          value: {
            type: 'CallExpression',
            callee: {
              type: 'MemberExpression',
              object: {
                type: 'MemberExpression',
                object: { type: 'Identifier', name: 'discord' },
                property: 'guilds',
              },
              property: 'list',
            },
            arguments: [],
          },
        },
        { type: 'ExpressionStatement', expression: { type: 'Identifier', name: 'guilds' } },
      ],
    });
  });

  test('rejects invalid source', () => {
    expect(() => parse('guilds =')).toThrow('Expected an expression');
  });

  test('parses arrays and objects', () => {
    expect(parse('value = [{name: "one"}, {name: "two"}]; value')).toEqual(expect.objectContaining({
      type: 'Program',
      body: expect.arrayContaining([expect.objectContaining({ type: 'Assignment', name: 'value' })]),
    }));
  });

  test('parses grouped expressions in call arguments', () => {
    expect(parse('result = choose((1 + 2));')).toEqual(expect.objectContaining({
      type: 'Program',
      body: [expect.objectContaining({
        type: 'Assignment',
        name: 'result',
        value: expect.objectContaining({ type: 'CallExpression' }),
      })],
    }));
  });

  test('ignores line comments', () => {
    expect(parse('// fetch the guilds\nvalue = 1; # retain the result\nvalue')).toEqual(expect.objectContaining({
      type: 'Program',
      body: expect.arrayContaining([expect.objectContaining({ type: 'Assignment', name: 'value' })]),
    }));
  });

  test('parses the complete core statement and expression forms', () => {
    const program = parse(`
      import "./shared.ds"
      fn announce(name, suffix) { return name }
      on("messageCreate") { print(event) }
      every(1000) { print("tick") }
      after(10) { print("once") }
      for (item in items) { print(item) }
      if (ready) { value = await source.get() } else if (!ready) { value = -1 } else { value = null }
      while (value < 2) { value = value + 1 }
      result = try { announce("a", "b") } catch (error) { error }
      source.method(1)
      result
    `);
    expect(program.type).toBe('Program');
    expect(program.body).toHaveLength(11);
  });

  test('rejects malformed core forms', () => {
    expect(() => parse('fn () {}')).toThrow(expect.objectContaining({ code: 'PARSE_ERROR' }));
    expect(() => parse('for (item of items) {}')).toThrow(expect.objectContaining({ code: 'PARSE_ERROR' }));
    expect(() => parse('on("message")')).toThrow(expect.objectContaining({ code: 'PARSE_ERROR' }));
    expect(() => parse('item => item')).not.toThrow();
    expect(() => parse('(item + 1) => item')).toThrow(expect.objectContaining({ code: 'PARSE_ERROR' }));
    expect(() => parse('try {}')).toThrow(expect.objectContaining({ code: 'PARSE_ERROR' }));
    expect(() => parse('@')).toThrow(expect.objectContaining({ code: 'PARSE_ERROR' }));
  });

  test('parses empty and alternate core forms', () => {
    expect(parse('fn noop() { return }; if (false) {} ; while (false) {} ; [] ; {} ; map([1], item => { return item })')).toMatchObject({ type: 'Program' });
    expect(parse('value = true; value = false; value = null')).toMatchObject({ type: 'Program' });
    expect(parse(';;; if (true) { ; } ; call(1, 2); value = \'single\'')).toMatchObject({ type: 'Program' });
    expect(parse('call(1)')).toMatchObject({ type: 'Program' });
    expect(precedence('unknown')).toBe(-1);
  });

  test('covers block and expression termination errors', () => {
    expect(() => parse('if (true) { value = 1')).toThrow(expect.objectContaining({ code: 'PARSE_ERROR' }));
    expect(parse('if (true) {}')).toMatchObject({ type: 'Program' });
  });
});
