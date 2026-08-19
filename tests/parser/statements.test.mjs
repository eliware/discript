import { describe, expect, test } from '@jest/globals';

describe('parser/statements', () => {
  test('module loads', async () => {
    await expect(import('../../src/parser/statements.mjs')).resolves.toBeDefined();
  });
});
