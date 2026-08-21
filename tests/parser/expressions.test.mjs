import { describe, expect, test } from '@jest/globals';

describe('parser/expressions', () => {
  test('module loads', async () => {
    await expect(import('../../src/parser/expressions.mjs')).resolves.toBeDefined();
  });

  test('parses chained calls, member access, and computed indexes', async () => {
    const { parse } = await import('../../src/parser.mjs');
    expect(parse('value = source.items[0].name; source.get()[key](arg)')).toMatchObject({
      body: [
        { type: 'Assignment', name: 'value', value: { type: 'MemberExpression', property: 'name', object: { type: 'IndexExpression' } } },
        { type: 'ExpressionStatement', expression: { type: 'CallExpression', arguments: [{ type: 'Identifier', name: 'arg' }] } },
      ],
    });
  });

  test('parses member and index assignment targets', async () => {
    const { parse } = await import('../../src/parser.mjs');
    expect(parse('object.name = "updated"; items[index] = value')).toMatchObject({
      body: [
        { type: 'Assignment', target: { type: 'MemberExpression', property: 'name' } },
        { type: 'Assignment', target: { type: 'IndexExpression', property: { type: 'Identifier', name: 'index' } } },
      ],
    });
  });

  test('rejects non-assignable expression targets', async () => {
    const { parse } = await import('../../src/parser.mjs');
    expect(() => parse('1 = value')).toThrow('assignment targets');
  });

  test('parses extended operators and compound assignments', async () => {
    const { parse, precedence } = await import('../../src/parser.mjs');
    expect(parse('count += 1; values[0] %= 2; result = missing ?? 3 ** 2')).toMatchObject({
      body: [
        { type: 'Assignment', name: 'count', operator: '+=' },
        { type: 'Assignment', target: { type: 'IndexExpression' }, operator: '%=' },
        { type: 'Assignment', name: 'result', value: { type: 'BinaryExpression', operator: '??' } },
      ],
    });
    expect(precedence('**')).toBeGreaterThan(precedence('*'));
  });
});
