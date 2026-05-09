import { EventHandler } from '../../../types/index.js';
import { dbConnect } from '../../utilities/dbConnect.js';
import { runServiceScheduler } from '../../utilities/ServiceScheduler.js';

export default {
  status: true,
  once: true,
  run: async function (client) {
    await dbConnect();

    logger.info(`Logged in as ${client.user.username} (${client.user.id}).`, 'prepare-fully-ready');
    client.isFullyReady = true;

    // Scheduler is not async, so we can run it below the fully ready log without affecting the bot.
    runServiceScheduler(client);
  },
} as EventHandler<[]>;
