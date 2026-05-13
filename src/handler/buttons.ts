import path from 'node:path';
import { ButtonHandler } from '../../types/index.js';
import BotClient from '../BotClient.js';
import { entryPath } from '../entryPath.js';
import { getRelativePathFromDir, resolveDynamicImportPath, scanFiles } from '../utilities/Utils.js';

const targetDir = '_buttons';
const buttonsPathDir = path.resolve(entryPath, targetDir);

/**
 * * Loads all enabled buttons from the `src/_buttons` directory and
 * registers them to the client. Logs the number of loaded buttons.
 * * This function will be called from the BotClient constructor.
 */
export default async function (client: BotClient): Promise<void> {
  const loadedButtons: string[] = [];

  // Scan all files within the buttons directory and its subdirectories,
  // and load them as button handlers if they are valid.
  const files = scanFiles(buttonsPathDir, 2) // 2 is enough for InteractionTypeFolder -> files.
    .filter((x) => x.endsWith('.js') || x.endsWith('.ts')); // Only consider .js and .ts files as potential button handlers.

  for (const file of files) {
    const buttonHandler: ButtonHandler = await import(resolveDynamicImportPath(file))
      .then((x) => x.default)
      .catch((err: Error) => err);

    // Get the path of the command file relative to the buttons directory for logging purposes.
    const relativePath = getRelativePathFromDir(file, buttonsPathDir, targetDir);

    // Skip the file if it doesn't export a valid ButtonHandler.
    if (
      buttonHandler instanceof Error ||
      !['status', 'id', 'run'].every((x) => Object.keys(buttonHandler).includes(x))
    ) {
      logger.warn(
        { error: buttonHandler },
        `Failed to load button from ${relativePath}. Ensure it exports a valid ButtonHandler with 'status', 'id', and 'run' properties.`,
      );
      continue;
    }

    // Skip the button if it's not enabled.
    if (!buttonHandler.status) continue;

    client.buttons.set(buttonHandler.id, buttonHandler);
    loadedButtons.push(buttonHandler.id);
  }

  logger.info(`Buttons loaded: ${loadedButtons.length} enabled.`);
  logger.debug(`${loadedButtons.join(', ')}`);
}
