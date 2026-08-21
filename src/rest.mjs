import { REST } from '@discordjs/rest';
import { loadConfig } from './config.mjs';

export function createDiscordRest({ token = loadConfig().token, version = '10', rest: suppliedRest } = {}) {
  if (!token) throw Object.assign(new Error('DISCORD_TOKEN is not set.'), { code: 'DISCORD_TOKEN_MISSING', exitCode: 4 });
  const rest = suppliedRest ?? new REST({ version }).setToken(token);
  return {
    rest,
    request(route, options = {}) { return rest.request({ method: options.method ?? 'GET', ...options, fullRoute: route }); },
  };
}
