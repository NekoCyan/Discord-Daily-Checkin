import type { EventHandler } from '../../types/index.js';
import { events } from '../_events/index.js';
import BotClient from '../BotClient.js';

/**
 * * Loads all enabled Events from the `src/_events` directory and
 * registers them to the client. Logs the number of loaded Events.
 * * This function will be called from the BotClient constructor.
 */
export default async function (client: BotClient): Promise<void> {
  const loadedEvents: string[] = [];

  for (const eventKey of Object.keys(events)) {
    const event = events[eventKey as keyof typeof events] as EventHandler;
    if (!event.status) continue;

    if (event.once) client.once(eventKey, (...args: unknown[]) => event.run(client, ...args));
    else client.on(eventKey, (...args: unknown[]) => event.run(client, ...args));

    loadedEvents.push(eventKey);
  }

  logger.info(`Events loaded: ${loadedEvents.length} enabled.`);
  logger.debug(`${loadedEvents.join(', ')}`);
}
