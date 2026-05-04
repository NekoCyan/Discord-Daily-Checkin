import Loader from './utilities/loader.js';
Loader();

import { GatewayIntentBits } from 'discord.js';
import BotClient from './BotClient.js';
import { dbDisconnect } from './utilities/dbConnect.js';

const client = new BotClient({
  intents: [GatewayIntentBits.Guilds],
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
