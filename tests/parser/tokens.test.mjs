import { describe, expect, test } from '@jest/globals';

describe('parser/tokens', () => {
  test('module loads', async () => {
    await expect(import('../../src/parser/tokens.mjs')).resolves.toBeDefined();
  });
});
