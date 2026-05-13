import { AnySelectMenuInteraction } from 'discord.js';
import path from 'node:path';
import { SelectMenuHandler } from '../../types/index.js';
import BotClient from '../BotClient.js';
import { entryPath } from '../entryPath.js';
import { getRelativePathFromDir, resolveDynamicImportPath, scanFiles } from '../utilities/Utils.js';

const targetDir = '_selectMenus';
const selectMenusPathDir = path.resolve(entryPath, targetDir);

/**
 * * Loads all enabled selectMenus from the `src/_selectMenus` directory and
 * registers them to the client. Logs the number of loaded selectMenus.
 * * This function will be called from the BotClient constructor.
 */
export default async function (client: BotClient): Promise<void> {
  const loadedSelectMenus: string[] = [];

  // Scan all files within the selectMenus directory and its subdirectories,
  // and load them as selectMenus handlers if they are valid.
  const files = scanFiles(selectMenusPathDir, 3) // 3 is enough for InteractionFolderType -> folder -> files.
    .filter((x) => x.endsWith('.js') || x.endsWith('.ts')); // Only consider .js and .ts files as potential selectMenus handlers.

  for (const file of files) {
    const selectMenusHandler: SelectMenuHandler<AnySelectMenuInteraction> = await import(
      resolveDynamicImportPath(file)
    )
      .then((x) => x.default)
      .catch((err: Error) => err);

    // Get the path of the command file relative to the selectMenus directory for logging purposes.
    const relativePath = getRelativePathFromDir(file, selectMenusPathDir, targetDir);

    // Skip the file if it doesn't export a valid SelectMenuHandler.
    if (
      selectMenusHandler instanceof Error ||
      !['status', 'id', 'run'].every((x) => Object.keys(selectMenusHandler).includes(x))
    ) {
      logger.warn(
        { error: selectMenusHandler },
        `Failed to load selectMenus from ${relativePath}. Ensure it exports a valid SelectMenuHandler with 'status', 'id', and 'run' properties.`,
      );
      continue;
    }

    // Skip the selectMenus if it's not enabled.
    if (!selectMenusHandler.status) continue;

    client.selectMenus.set(selectMenusHandler.id, selectMenusHandler);
    loadedSelectMenus.push(selectMenusHandler.id);
  }

  logger.info(`Select Menus loaded: ${loadedSelectMenus.length} enabled.`);
  logger.debug(`${loadedSelectMenus.join(', ')}`);
}
