import { describe, expect, test } from '@jest/globals';

describe('discord/guild-emojis', () => {
  test('module loads', async () => {
    await expect(import('../../src/discord/guild-emojis.mjs')).resolves.toBeDefined();
  });
});
