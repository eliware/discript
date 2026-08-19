import { describe, expect, test } from '@jest/globals';

describe('discord/guilds', () => {
  test('module loads', async () => {
    await expect(import('../../src/discord/guilds.mjs')).resolves.toBeDefined();
  });
});
