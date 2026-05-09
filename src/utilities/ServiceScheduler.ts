import cron from 'node-cron';
import BotClient from '../BotClient.js';
import { EndfieldRunBatchCheckIn } from '../helper/Endfield/RunBatchCheckIn.js';
import EndfieldService from '../services/endfield.service.js';

let isRunning = false;

/**
 * Initializes and runs the service scheduler for the bot. This function sets up scheduled tasks (using cron) to run specific services at defined intervals.
 * This function should be called whenever the bot client is ready or in a scheduled task (e.g., using cron) to ensure that users are checked in on a regular basis.
 * @param client The bot client instance.
 * @returns void
 */
export function runServiceScheduler(client: BotClient) {
  if (isRunning) return logger.warn('Scheduler is already running. Ignoring duplicate call.');
  isRunning = true;

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
}
