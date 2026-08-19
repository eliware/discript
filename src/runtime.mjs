import { Client, GatewayIntentBits } from 'discord.js';
import { log } from '@eliware/common';
import { loadConfig } from './config.mjs';

export async function createDiscordRuntime({ token = loadConfig().token, client: suppliedClient } = {}) {
  if (!token) throw Object.assign(new Error('DISCORD_TOKEN is not set.'), { code: 'DISCORD_TOKEN_MISSING', exitCode: 4 });
  const client = suppliedClient ?? new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers] });
  let stopped = false;
  let resolveStopped;
  const stoppedPromise = new Promise(resolve => { resolveStopped = resolve; });
  await new Promise((resolve, reject) => {
    const onReady = () => {
      client.off('error', onError);
      resolve();
    };
    const onError = error => {
      client.off('clientReady', onReady);
      client.off('error', onError);
      reject(error);
    };
    client.once('clientReady', onReady);
    client.once('error', onError);
    client.login(token).catch(onError);
  });
  return {
    client,
    async shutdown() {
      if (stopped) return;
      stopped = true;
      try { await client.destroy(); }
      catch (error) { log.warn('Discord shutdown failed', { error: error.message }); }
      resolveStopped();
    },
    waitForStop() { return stoppedPromise; },
  };
}
