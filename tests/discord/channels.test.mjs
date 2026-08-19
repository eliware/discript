import { describe, expect, test } from '@jest/globals';

describe('discord/channels', () => {
  test('module loads', async () => {
    await expect(import('../../src/discord/channels.mjs')).resolves.toBeDefined();
  });
});
