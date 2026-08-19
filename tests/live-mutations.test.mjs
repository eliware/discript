import { describe, expect, test } from '@jest/globals';
import { createDiscordRuntime } from '../src/runtime.mjs';
import { createDiscordApi } from '../src/discord.mjs';
import { loadConfig, requireTestGuild } from '../src/config.mjs';

const enabled = process.env.DISCRIPT_LIVE === '1' && process.env.DISCRIPT_LIVE_MUTATIONS === '1';

describe('live Discord mutations', () => {
  (enabled ? test : test.skip)('creates and deletes a temporary test channel', async () => {
    const config = loadConfig();
    const runtime = await createDiscordRuntime({ token: config.token });
    let created;
    try {
      const guild = createDiscordApi(runtime.client, { yes: true }).guilds.get(requireTestGuild(config));
      created = await guild.channels.create(`discript-test-${Date.now()}`);
      expect(created.id).toBeTruthy();
      const api = createDiscordApi(runtime.client, { yes: true });
      const message = await api.channels.get(created.id).send('discript mutation test');
      await api.messages.edit(created.id, message.id, 'discript mutation test edited');
      await api.messages.delete(created.id, message.id);
      await api.channels.get(created.id).delete();
    } finally {
      await runtime.shutdown();
    }
  }, 30000);
});
