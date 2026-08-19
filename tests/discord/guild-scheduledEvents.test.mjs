import { describe, expect, test } from '@jest/globals';

describe('discord/guild-scheduledEvents', () => {
  test('module loads', async () => {
    await expect(import('../../src/discord/guild-scheduledEvents.mjs')).resolves.toBeDefined();
  });
});
