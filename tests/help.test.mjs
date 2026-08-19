import { describe, expect, test } from '@jest/globals';

describe('help', () => {
  test('module loads', async () => {
    await expect(import('../src/help.mjs')).resolves.toBeDefined();
  });
});
