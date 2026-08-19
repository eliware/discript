import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import {
  log,
  registerHandlers,
  registerSignals,
} from '@eliware/common';

const errors = registerHandlers({ log });
let client;
let shuttingDown = false;

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  try {
    await client?.destroy();
  } finally {
    errors.removeHandlers();
  }
}

registerSignals({
  log,
  shutdownHook: shutdown,
});

const token = process.env.DISCORD_TOKEN;

if (!token) {
  log.error('DISCORD_TOKEN is not set in .env');
  process.exitCode = 1;
} else {
  client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.once('clientReady', async readyClient => {
    console.log(`Logged in as ${readyClient.user.tag}`);
    console.log('Guild IDs:');

    for (const guild of readyClient.guilds.cache.values()) {
      console.log(`${guild.name} (${guild.id})`);
    }

    await shutdown();
  });

  try {
    await client.login(token);
  } catch (error) {
    log.error('Unable to log in to Discord', { error: error.message });
    process.exitCode = 1;
    await shutdown();
  }
}
