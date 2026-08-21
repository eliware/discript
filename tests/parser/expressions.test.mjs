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

  test('parses conditional expressions and optional chains', async () => {
    const { parse } = await import('../../src/parser.mjs');
    expect(parse('label = ready ? "yes" : "no"; result = user?.profile?.[key]?.name?.()')).toMatchObject({
      body: [
        { type: 'Assignment', name: 'label', value: { type: 'ConditionalExpression' } },
        { type: 'Assignment', name: 'result', value: { type: 'CallExpression', optional: true } },
      ],
    });
  });

  test('parses array and object spread elements', async () => {
    const { parse } = await import('../../src/parser.mjs');
    expect(parse('items = [0, ...source, 4]; config = {...defaults, mode: "safe"}')).toMatchObject({
      body: [
        { type: 'Assignment', value: { type: 'ArrayExpression', elements: [{ type: 'Literal' }, { type: 'SpreadElement' }, { type: 'Literal' }] } },
        { type: 'Assignment', value: { type: 'ObjectExpression', properties: [{ type: 'SpreadProperty' }, { type: 'Property' }] } },
      ],
    });
  });

  test('parses zero-argument arrow callbacks', async () => {
    const { parse } = await import('../../src/parser.mjs');
    expect(parse('callback = () => 42')).toMatchObject({ body: [{ type: 'Assignment', value: { type: 'ArrowExpression', parameter: null } }] });
  });

  test('parses shorthand object patterns for destructuring', async () => {
    const { parse } = await import('../../src/parser.mjs');
    expect(parse('[first, second, ...remaining] = values; {name, type, ...rest} = channel')).toMatchObject({
      body: [
        { type: 'DestructuringAssignment', pattern: { type: 'ArrayExpression' } },
        { type: 'DestructuringAssignment', pattern: { type: 'ObjectExpression', properties: [{ type: 'Property', value: { type: 'Identifier', name: 'name' } }, { type: 'Property' }, { type: 'SpreadProperty' }] } },
      ],
    });
  });
});
