import { describe, expect, test } from '@jest/globals';

describe('discord/normalization', () => {
  test('module loads', async () => {
    await expect(import('../../src/discord/normalization.mjs')).resolves.toBeDefined();
  });
});
