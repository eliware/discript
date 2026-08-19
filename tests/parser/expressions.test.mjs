import { describe, expect, test } from '@jest/globals';

describe('parser/expressions', () => {
  test('module loads', async () => {
    await expect(import('../../src/parser/expressions.mjs')).resolves.toBeDefined();
  });
});
