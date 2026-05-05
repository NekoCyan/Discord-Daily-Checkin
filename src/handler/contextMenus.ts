import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import path from 'node:path';
import { ContextMenuHandler } from '../../types/index.js';
import BotClient from '../BotClient.js';
import { entryPath } from '../entryPath.js';
import { getRelativePathFromDir, resolveDynamicImportPath, scanFiles } from '../utilities/Utils.js';

const targetDir = '_contextMenus';
const contextMenusPathDir = path.resolve(entryPath, targetDir);

/**
 * * Loads all enabled context menus from the `src/_contextMenus` directory and
 * registers them to the client. Returns an array of the metadata of the loaded
 * context menus for registration with Discord.
 * * This function will be called from commandRegistration.
 */
export default async function contextMenus(
  client: BotClient,
): Promise<RESTPostAPIChatInputApplicationCommandsJSONBody[]> {
  const loaded: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

  // Scan all files within the contextMenus directory and its subdirectories,
  // and load them as context menu handlers if they are valid.
  const files = scanFiles(contextMenusPathDir, 2) // 2 is enough for User/Message folder -> files.
    .filter((x) => x.endsWith('.js') || x.endsWith('.ts')); // Only consider .js and .ts files as potential context menu handlers.

  for (const file of files) {
    const contextMenu: ContextMenuHandler = await import(resolveDynamicImportPath(file))
      .then((x) => x.default)
      .catch((err: Error) => err);

    // Get the path of the context menu file relative to the contextMenus directory for logging purposes.
    const relativePath = getRelativePathFromDir(file, contextMenusPathDir, targetDir);

    // Skip the file if it doesn't export a valid ContextMenuHandler.
    if (
      contextMenu instanceof Error ||
      !['status', 'metadata', 'run'].every((x) => Object.keys(contextMenu).includes(x))
    ) {
      logger.warn(
        { error: contextMenu },
        `Failed to load context menu from ${relativePath}. Ensure it exports a valid ContextMenuHandler with 'status', 'metadata', and 'run' properties.`,
      );
      continue;
    }

    // Skip the context menu if it's not enabled.
    if (!contextMenu.status) continue;

    const metadata = contextMenu.metadata.toJSON();
    if (metadata.name) {
      client.contextMenus.set(metadata.name, contextMenu);
      loaded.push(metadata);
    } else {
      logger.warn(`Failed to load context menu from ${relativePath}. Ensure it has a valid name.`);
      continue;
    }
  }

  return loaded;
}
