import { describe, expect, test } from '@jest/globals';

describe('cli/script', () => {
  test('module loads', async () => {
    await expect(import('../../src/cli/script.mjs')).resolves.toBeDefined();
  });
});
