import { describe, expect, test } from '@jest/globals';

describe('discord/guild-invites', () => {
  test('module loads', async () => {
    await expect(import('../../src/discord/guild-invites.mjs')).resolves.toBeDefined();
  });
});
