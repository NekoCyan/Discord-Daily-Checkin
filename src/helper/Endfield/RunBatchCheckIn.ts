import { DiscordAPIError } from 'discord.js';
import PQueue from 'p-queue';
import { QualifiedBatchCheckInOptions } from '../../../types/index.js';
import BotClient from '../../BotClient.js';
import EndfieldModel from '../../models/Endfield.js';
import { EndfieldHydratedDocument } from '../../models/interfaces/_Endfield.js';
import { sleep } from '../../utilities/Utils.js';
import { EndfieldDoCheckIn } from './DoCheckIn.js';

let isRunning = false;

const msg = (message: string, count?: number) =>
  count !== undefined
    ? `[Endfield/BatchCheckIn/${count}] ${message}`
    : `[Endfield/BatchCheckIn] ${message}`;

/**
 * Runs the batch check-in process for Endfield users. This function is designed to be called on a scheduled basis (e.g., daily) to check in all users who haven't been checked in for the day.
 * This function should be called whenever the bot client is ready or in a scheduled task (e.g., using cron) to ensure that users are checked in on a regular basis.
 * @param client The bot client instance.
 * @param options The options for the batch check-in process, including batch size, delay per batch, and concurrency.
 * @returns A promise that resolves when the batch check-in process is complete.
 */
export async function EndfieldRunBatchCheckIn(
  client: BotClient,
  options: QualifiedBatchCheckInOptions,
) {
  if (isRunning) return logger.warn(msg('Previous batch still in progress, skipping this run.'));
  isRunning = true;

  logger.info(msg('Starting batch check-in process...'), 'endfield-check-in');

  logger.debug(
    {
      ...options,
    },
    msg('Batch check-in options:'),
  );

  let loopCount = 0;

  const batchSize = options.batchSize;
  const delayPerBatchMs = options.delayPerBatchMs;
  const concurrency = options.concurrency;

  const queue = new PQueue({
    concurrency,
  });

  try {
    while (true) {
      loopCount++;

      const batched = await EndfieldModel.getBatchUncheckedDaily(batchSize);
      if (batched.length === 0) {
        logger.debug(msg('No more users to check-in, ending batch process.', loopCount));
        break;
      }

      logger.debug(msg(`Processing ${batched.length} users in the current batch...`, loopCount));

      const task = async (endfieldModel: EndfieldHydratedDocument) => {
        // Fetch user to check-in.
        const fetchedUser = await client.users
          .fetch(endfieldModel.discordId)
          .catch((e: DiscordAPIError) => e);
        // If user not found, delete the endfield document. Otherwise, log the error and skip check-in for this user.
        if (fetchedUser instanceof DiscordAPIError) {
          if (fetchedUser.code === 10013) {
            // User not found.
            await endfieldModel.deleteOne();
          } else {
            // Generic error while fetching user, skip check-in for this user and log the error.
            await endfieldModel.markLastDailyAsToday();
            logger.error(
              {
                err: fetchedUser,
              },
              msg(
                `Error while fetching user ${endfieldModel.discordId} (Skipped check-in for this user).`,
                loopCount,
              ),
            );
          }
          return;
        }

        return EndfieldDoCheckIn(client, fetchedUser);
      };

      // Add all tasks in the current batch to the queue.
      batched.forEach((endfieldModel) => {
        queue.add(() => task(endfieldModel));
      });

      // Wait for the current batch to complete before proceeding to the next batch.
      await queue.onIdle();

      logger.debug(
        msg(
          `Batch ${loopCount} completed. Waiting for ${delayPerBatchMs}ms before next batch...`,
          loopCount,
        ),
      );

      if (delayPerBatchMs > 0) await sleep(delayPerBatchMs);
    }
  } catch (error) {
    logger.error(`[Endfield/BatchCheckIn] Error during batch check-in: ${error}`);
  } finally {
    logger.info('[Endfield/BatchCheckIn] Batch check-in process completed.', 'endfield-check-in');
    isRunning = false;
  }
}
