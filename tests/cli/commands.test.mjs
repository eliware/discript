import { describe, expect, test } from '@jest/globals';

describe('cli/commands', () => {
  test('module loads', async () => {
    await expect(import('../../src/cli/commands.mjs')).resolves.toBeDefined();
  });
});
