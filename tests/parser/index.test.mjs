import { describe, expect, test } from '@jest/globals';

describe('parser/index', () => {
  test('module loads', async () => {
    await expect(import('../../src/parser/index.mjs')).resolves.toBeDefined();
  });
});
