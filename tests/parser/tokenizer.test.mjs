import { describe, expect, test } from '@jest/globals';

describe('parser/tokenizer', () => {
  test('module loads', async () => {
    await expect(import('../../src/parser/tokenizer.mjs')).resolves.toBeDefined();
  });

  test('records line and column locations on tokens', async () => {
    const { tokenize } = await import('../../src/parser/tokenizer.mjs');
    expect(tokenize('one\n  two')[1].location).toMatchObject({ line: 2, column: 3, offset: 6 });
  });

  test('reports the location of invalid input', async () => {
    const { tokenize } = await import('../../src/parser/tokenizer.mjs');
    expect(() => tokenize('ok\n  @')).toThrow(expect.objectContaining({ details: { line: 2, column: 3, offset: 5 } }));
  });
});
