import { Client, GatewayIntentBits } from 'discord.js';
import { log } from '@eliware/common';

export async function createDiscordRuntime({ token = process.env.DISCORD_TOKEN } = {}) {
  if (!token) throw Object.assign(new Error('DISCORD_TOKEN is not set.'), { code: 'DISCORD_TOKEN_MISSING', exitCode: 4 });
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  let stopped = false;
  await new Promise((resolve, reject) => {
    const onReady = () => {
      client.off('error', onError);
      resolve();
    };
    const onError = error => {
      client.off('clientReady', onReady);
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
    },
  };
}
