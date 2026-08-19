import { describe, expect, test } from '@jest/globals';

describe('discord/guild-channels', () => {
  test('module loads', async () => {
    await expect(import('../../src/discord/guild-channels.mjs')).resolves.toBeDefined();
  });
});
