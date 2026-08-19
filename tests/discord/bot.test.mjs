import { describe, expect, test } from '@jest/globals';

describe('discord/bot', () => {
  test('module loads', async () => {
    await expect(import('../../src/discord/bot.mjs')).resolves.toBeDefined();
  });
});
