import 'dotenv/config';

export function loadConfig(env = process.env) {
  const token = String(env.DISCORD_TOKEN ?? '').trim();
  const testGuild = String(env.TEST_GUILD ?? '').trim();
  return {
    token: token || null,
    testGuild: testGuild || null,
  };
}

export function requireTestGuild(config = loadConfig()) {
  if (!config.testGuild) throw Object.assign(new Error('TEST_GUILD is not configured.'), { code: 'TEST_GUILD_MISSING', exitCode: 2 });
  if (!/^\d+$/.test(config.testGuild)) throw Object.assign(new Error('TEST_GUILD must be a Discord guild ID.'), { code: 'TEST_GUILD_INVALID', exitCode: 2 });
  return config.testGuild;
}
