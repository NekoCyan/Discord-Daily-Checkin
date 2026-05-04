import { EventHandler } from '../../../types/index.js';
import { dbConnect } from '../../utilities/dbConnect.js';

export default {
  status: true,
  once: true,
  run: async function (client) {
    await dbConnect();

    logger.info(`Logged in as ${client.user.username} (${client.user.id}).`, 'prepare-fully-ready');
    client.isFullyReady = true;
  },
} as EventHandler<[]>;
