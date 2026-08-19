import { describe, expect, test } from '@jest/globals';

describe('discord/guild-members', () => {
  test('module loads', async () => {
    await expect(import('../../src/discord/guild-members.mjs')).resolves.toBeDefined();
  });
});
