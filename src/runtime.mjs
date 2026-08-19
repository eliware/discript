import { Client, GatewayIntentBits } from 'discord.js';
import { log } from '@eliware/common';
import { loadConfig } from './config.mjs';

export async function createDiscordRuntime({ token = loadConfig().token, client: suppliedClient, loginTimeout = 15000 } = {}) {
  if (!token) throw Object.assign(new Error('DISCORD_TOKEN is not set.'), { code: 'DISCORD_TOKEN_MISSING', exitCode: 4 });
  const configured = loadConfig();
  const client = suppliedClient ?? new Client({ intents: resolveGatewayIntentBits(configured.intents) });
  let stopped = false;
  let resolveStopped;
  const stoppedPromise = new Promise(resolve => { resolveStopped = resolve; });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => onError(Object.assign(new Error(`Discord login timed out after ${loginTimeout}ms.`), { code: 'DISCORD_LOGIN_TIMEOUT', exitCode: 4 })), loginTimeout);
      const onReady = () => {
        clearTimeout(timeout);
        client.off('error', onError);
        resolve();
      };
      const onError = error => {
        clearTimeout(timeout);
        client.off('clientReady', onReady);
        client.off('error', onError);
        reject(error);
      };
      client.once('clientReady', onReady);
      client.once('error', onError);
      Promise.resolve().then(() => client.login(token)).catch(onError);
    });
  } catch (error) {
    try { await client.destroy?.(); }
    catch (shutdownError) { log.warn('Discord startup cleanup failed', { error: shutdownError.message }); }
    throw error;
  }
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

export function resolveGatewayIntentBits(names) {
  const resolved = names.map(name => GatewayIntentBits[name]);
  const invalid = names.find((name, index) => resolved[index] === undefined);
  if (invalid) throw Object.assign(new Error(`DISCRIPT_INTENTS contains unknown gateway intent: ${invalid}.`), { code: 'DISCRIPT_INTENTS_INVALID', exitCode: 2 });
  return resolved;
}
