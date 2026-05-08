import cron from 'node-cron';
import { EventHandler } from '../../../types/index.js';
import { EndfieldRunBatchCheckIn } from '../../helper/Endfield/RunBatchCheckIn.js';
import EndfieldService from '../../services/endfield.service.js';
import { dbConnect } from '../../utilities/dbConnect.js';

export default {
  status: true,
  once: true,
  run: async function (client) {
    await dbConnect();

    logger.info(`Logged in as ${client.user.username} (${client.user.id}).`, 'prepare-fully-ready');
    client.isFullyReady = true;

    // Schedule batch check-in to run at 00:00 (midnight) every day, according to the timezone specified in EndfieldService.Constants.DAILY_RESET_TIMEZONE.
    cron.schedule(
      '0 0 * * *',
      async () => await EndfieldRunBatchCheckIn(client, client.batchCheckInOptions),
      {
        timezone: EndfieldService.Constants.DAILY_RESET_TIMEZONE,
      },
    );
    /**
     * * Schedule batch check-in to run at 12:00 (noon) every day, according to the timezone specified in EndfieldService.Constants.DAILY_RESET_TIMEZONE.
     * * This will serve as a backup in case the midnight check-in fails for any reason, ensuring that users still get checked in on the same day.
     */
    cron.schedule(
      '0 12 * * *',
      async () => await EndfieldRunBatchCheckIn(client, client.batchCheckInOptions),
      {
        timezone: EndfieldService.Constants.DAILY_RESET_TIMEZONE,
      },
    );
    // Manual trigger once when the bot starts, to ensure users get checked in even if the bot restarts after the scheduled time.
    EndfieldRunBatchCheckIn(client, client.batchCheckInOptions);
  },
} as EventHandler<[]>;
