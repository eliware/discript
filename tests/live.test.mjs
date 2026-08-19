import { describe, expect, test } from '@jest/globals';
import { createDiscordRuntime } from '../src/runtime.mjs';
import { createDiscordApi } from '../src/discord.mjs';
import { loadConfig, requireTestGuild } from '../src/config.mjs';

const live = process.env.DISCRIPT_LIVE === '1';

describe('live Discord integration', () => {
  (live ? test : test.skip)('lists the configured test guild', async () => {
    const config = loadConfig();
    const runtime = await createDiscordRuntime({ token: config.token });
    try {
      const guild = createDiscordApi(runtime.client).guilds.get(requireTestGuild(config));
      expect(guild.id).toBe(config.testGuild);
    } finally {
      await runtime.shutdown();
    }
  }, 30000);
});
