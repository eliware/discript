import { describe, expect, test } from '@jest/globals';

describe('discord/guild-stickers', () => {
  test('module loads', async () => {
    await expect(import('../../src/discord/guild-stickers.mjs')).resolves.toBeDefined();
  });
});
