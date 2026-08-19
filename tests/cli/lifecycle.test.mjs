import { describe, expect, test } from '@jest/globals';

describe('cli/lifecycle', () => {
  test('module loads', async () => {
    await expect(import('../../src/cli/lifecycle.mjs')).resolves.toBeDefined();
  });
});
