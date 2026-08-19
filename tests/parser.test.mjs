import { describe, expect, test } from '@jest/globals';
import { parse } from '../src/parser.mjs';

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
});
