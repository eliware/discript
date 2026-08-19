import { describe, expect, test } from '@jest/globals';

describe('cli/mutations', () => {
  test('module loads', async () => {
    await expect(import('../../src/cli/mutations.mjs')).resolves.toBeDefined();
  });
});
