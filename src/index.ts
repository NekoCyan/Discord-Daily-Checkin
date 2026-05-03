import Loader from './utilities/loader.js';
Loader();

import { GatewayIntentBits } from 'discord.js';
import BotClient from './BotClient.js';

const client = new BotClient({
  intents: [GatewayIntentBits.Guilds],
});

client.Login(process.env.DISCORD_TOKEN);
