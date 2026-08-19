import { describe, expect, test } from '@jest/globals';

describe('discord/guild-roles', () => {
  test('module loads', async () => {
    await expect(import('../../src/discord/guild-roles.mjs')).resolves.toBeDefined();
  });
});
