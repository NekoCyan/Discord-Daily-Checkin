import Loader from './utilities/Loader.js';
Loader();

import { GatewayIntentBits } from 'discord.js';
import BotClient from './BotClient.js';
import { dbDisconnect } from './utilities/dbConnect.js';

const client = new BotClient({
  intents: [GatewayIntentBits.Guilds],
  batchCheckInOptions: {
    batchSize: process.env.BATCH_SIZE ? Number(process.env.BATCH_SIZE) : undefined,
    delayPerBatchMs: process.env.DELAY_PER_BATCH_MS
      ? Number(process.env.DELAY_PER_BATCH_MS)
      : undefined,
    concurrency: process.env.CONCURRENCY ? Number(process.env.CONCURRENCY) : undefined,
  },
});

client.Login(process.env.DISCORD_TOKEN);

// Graceful shutdown
process.on('SIGINT', async () => {
  await dbDisconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await dbDisconnect();
  process.exit(0);
});
