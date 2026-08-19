import { describe, expect, test } from '@jest/globals';

describe('input', () => {
  test('module loads', async () => {
    await expect(import('../src/input.mjs')).resolves.toBeDefined();
  });
});
