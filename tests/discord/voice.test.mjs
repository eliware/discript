import { describe, expect, test } from '@jest/globals';

describe('discord/voice', () => {
  test('module loads', async () => {
    await expect(import('../../src/discord/voice.mjs')).resolves.toBeDefined();
  });
});
