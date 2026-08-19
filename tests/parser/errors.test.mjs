import { describe, expect, test } from '@jest/globals';

describe('parser/errors', () => {
  test('module loads', async () => {
    await expect(import('../../src/parser/errors.mjs')).resolves.toBeDefined();
  });
});
