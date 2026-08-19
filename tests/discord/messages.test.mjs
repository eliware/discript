import { describe, expect, test } from '@jest/globals';

describe('discord/messages', () => {
  test('module loads', async () => {
    await expect(import('../../src/discord/messages.mjs')).resolves.toBeDefined();
  });
});
