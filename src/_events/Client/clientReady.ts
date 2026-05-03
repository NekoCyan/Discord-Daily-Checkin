import { EventHandler } from '../../../types/index.js';

export default {
  status: true,
  once: true,
  run: async function (client) {
    logger.info(`Logged in as ${client.user.username} (${client.user.id}).`, 'prepare-fully-ready');
    client.isFullyReady = true;
  },
} as EventHandler<[]>;
