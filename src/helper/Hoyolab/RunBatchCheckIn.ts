import { DiscordAPIError } from 'discord.js';
import PQueue from 'p-queue';
import { QualifiedBatchCheckInOptions } from '../../../types/index.js';
import BotClient from '../../BotClient.js';
import HoyolabModel from '../../models/Hoyolab.js';
import { HoyolabHydratedDocument } from '../../models/interfaces/_Hoyolab.js';
import HoyolabService, { HoyolabCheckInCache } from '../../services/hoyolab.service.js';
import { sleep } from '../../utilities/Utils.js';
import { HoyolabDoCheckIn } from './DoCheckIn.js';

let isRunning = false;

const msg = (message: string, count?: number) =>
  count !== undefined
    ? `[Hoyolab/BatchCheckIn/${count}] ${message}`
    : `[Hoyolab/BatchCheckIn] ${message}`;

/**
 * Runs the batch check-in process for Hoyolab users. This function is designed to be called on a
 * scheduled basis (e.g., daily) to check in all users who haven't been checked in for the day.
 * This function should be called by the service scheduler at the scheduled times, and it
 * can also be triggered manually if needed (e.g., for testing or if a scheduled run fails).
 *
 * This batch check-in process works by fetching users in batches (based on the specified batch size),
 * checking them in concurrently (based on the specified concurrency), and introducing a delay between
 * batches to avoid hitting rate limits. The function continues to fetch and process batches until there
 * are no more users left to check in for the day.
 * @param client The bot client instance.
 * @param options The options for the batch check-in process.
 * @returns A promise that resolves when the batch check-in process is complete.
 */
export async function HoyolabRunBatchCheckIn(
  client: BotClient,
  options: QualifiedBatchCheckInOptions,
) {
  if (isRunning) return logger.warn(msg('Previous batch still in progress, skipping this run.'));
  isRunning = true;

  logger.info(msg('Starting batch check-in process...'), 'hoyolab-check-in');

  /**
   * `{language}` => calendar data.
   * This is used to cache the calendar data for each game and language combination, so we don't have to fetch it multiple times during the batch check-in process, which can significantly reduce the number of API calls and improve performance.
   */
  const cache: Record<string, HoyolabCheckInCache> = {};
  const fetchingPromises: Record<string, Promise<HoyolabCheckInCache>> = {};
  // Fetch all calendar for cache.
  const getOrFetchCalendar = (language: string): Promise<HoyolabCheckInCache> => {
    // Already cached — return immediately
    if (cache[language]) return Promise.resolve(cache[language]);

    // Already fetching for this language — reuse the same promise
    // so all concurrent callers wait on the ONE in-flight request
    if (fetchingPromises[language]) return fetchingPromises[language];

    // First time seeing this language — start fetching and store the promise
    fetchingPromises[language] = HoyolabService.getAllGamesCalendar(language)
      .then((fetched) => {
        const mapped = Object.fromEntries(
          Object.entries(fetched).map(([gameAbbr, calendar]) => [gameAbbr, calendar]),
        );
        cache[language] = mapped;
        delete fetchingPromises[language]; // clean up in-flight tracker
        return mapped;
      })
      .catch((err) => {
        delete fetchingPromises[language]; // clean up on failure so it can retry next time
        throw err;
      });

    return fetchingPromises[language];
  };

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

      const batched = await HoyolabModel.getBatchUncheckedDaily(batchSize);
      if (batched.length === 0) {
        logger.debug(msg('No more users to check-in, ending batch process.', loopCount));
        break;
      }

      logger.debug(msg(`Processing ${batched.length} users in the current batch...`, loopCount));

      const task = async (model: HoyolabHydratedDocument) => {
        const cache = await getOrFetchCalendar(model.lang);

        // Fetch user to check-in.
        const fetchedUser = await client.users
          .fetch(model.discordId)
          .catch((e: DiscordAPIError) => e);
        // If user not found, delete the hoyolab document. Otherwise, log the error and skip check-in for this user.
        if (fetchedUser instanceof DiscordAPIError) {
          if (fetchedUser.code === 10013) {
            // User not found.
            await model.deleteOne();
          } else {
            // Generic error while fetching user, skip check-in for this user and log the error.
            await model.markLastDailyAsToday();
            logger.error(
              {
                err: fetchedUser,
              },
              msg(
                `Error while fetching user ${model.discordId} (Skipped check-in for this user).`,
                loopCount,
              ),
            );
          }
          return;
        }

        return HoyolabDoCheckIn(client, fetchedUser, undefined, cache);
      };

      // Add all tasks in the current batch to the queue.
      batched.forEach((model) => {
        queue.add(() => task(model));
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
    logger.error({ ...(error as Error) }, msg(`Error during batch check-in:`));
  } finally {
    logger.info(msg('Batch check-in process completed.'), 'hoyolab-check-in');
    isRunning = false;
  }
}
