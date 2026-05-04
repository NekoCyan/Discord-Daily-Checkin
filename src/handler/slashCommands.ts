import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import path from 'node:path';
import { SlashCommandHandler } from '../../types/index.js';
import BotClient from '../BotClient.js';
import { entryPath } from '../entryPath.js';
import { getRelativePathFromDir, resolveDynamicImportPath, scanFiles } from '../utilities/Utils.js';

const targetDir = '_slashCommands';
const slashCommandsPathDir = path.resolve(entryPath, targetDir);

/**
 * * Loads all enabled slash commands from the `src/_slashCommands` directory and
 * registers them to the client. Returns an array of the metadata of the loaded
 * slash commands for registration with Discord.
 * * This function will be called from commandRegistration.
 */
export default async function slashCommands(
  client: BotClient,
): Promise<RESTPostAPIChatInputApplicationCommandsJSONBody[]> {
  const loaded: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

  // Scan all files within the slashCommands directory and its subdirectories,
  // and load them as slash command handlers if they are valid.
  const files = scanFiles(slashCommandsPathDir, 2) // 2 is enough for folder -> files.
    .filter((x) => x.endsWith('.js') || x.endsWith('.ts')); // Only consider .js and .ts files as potential command handlers.

  for (const file of files) {
    const slashCommand: SlashCommandHandler = await import(resolveDynamicImportPath(file))
      .then((x) => x.default)
      .catch((err: Error) => err);

    // Get the path of the command file relative to the slashCommands directory for logging purposes.
    const relativePath = getRelativePathFromDir(file, slashCommandsPathDir, targetDir);

    // Skip the file if it doesn't export a valid SlashCommandHandler.
    if (
      slashCommand instanceof Error ||
      !['status', 'metadata', 'run'].every((x) => Object.keys(slashCommand).includes(x))
    ) {
      logger.warn(
        { error: slashCommand },
        `Failed to load slash command from ${relativePath}. Ensure it exports a valid SlashCommandHandler with 'status', 'metadata', and 'run' properties.`,
      );
      continue;
    }

    // Skip the command if it's not enabled.
    if (!slashCommand.status) continue;

    const metadata = slashCommand.metadata.toJSON();
    if (metadata.name) {
      client.slashCommands.set(metadata.name, slashCommand);
      loaded.push(metadata);
    } else {
      logger.warn(`Failed to load slash command from ${relativePath}. Ensure it has a valid name.`);
      continue;
    }
  }

  return loaded;
}
