import { describe, expect, test } from '@jest/globals';

describe('discord/safety', () => {
  test('module loads', async () => {
    await expect(import('../../src/discord/safety.mjs')).resolves.toBeDefined();
  });
});
