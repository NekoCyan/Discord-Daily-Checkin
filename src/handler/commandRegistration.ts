import {
  APIApplicationCommand,
  ApplicationCommandType,
  REST,
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from 'discord.js';
import BotClient from '../BotClient.js';
import contextMenus from './contextMenus.js';
import slashCommands from './slashCommands.js';

export default async function (client: BotClient): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(client.token);

  // Initilize an array to hold the metadata of the loaded commands for registration with Discord.
  const loaded: RESTPostAPIApplicationCommandsJSONBody[] = [
    ...(await slashCommands(client)),
    ...(await contextMenus(client)),
  ];

  if (loaded.length === 0) return;

  // Extract the client ID from the bot token for use in the API route.
  // The client ID is the first part of the token before the first period, and is base64 encoded.
  const b64TokenID = client.token.split('.')[0];
  if (!b64TokenID) throw new Error(`Failed to extract client ID from token. Invalid token format.`);
  const CLIENT_ID = Buffer.from(b64TokenID, 'base64').toString('ascii');

  logger.info(`PENDING | Registering commands ...`, 'command-registration');

  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: loaded }).then((d: unknown) => {
      const data = d as APIApplicationCommand[];
      if (!data?.[0]) {
        throw new Error(`ERROR | No application commands data collected from API.`);
      }

      const slashCommandsData = data.filter((x) => x.type === ApplicationCommandType.ChatInput);
      slashCommandsData.forEach((x) => {
        client.slashCommandsRequested.set(x.name, x);
      });

      const contextMenusData = data.filter(
        (x) => x.type === ApplicationCommandType.User || x.type === ApplicationCommandType.Message,
      );
      contextMenusData.forEach((x) => {
        client.contextMenusRequested.set(x.name, x);
      });
    });
    logger.info(
      `SUCCESS | Registered ${client.slashCommandsRequested.size} slash commands and ${client.contextMenusRequested.size} context menus.`,
      'command-registration',
    );

    logger.debug(
      `Slash Commands: ${[...client.slashCommandsRequested.values()].map((x) => x.name).join(', ') || 'None'}`,
    );
    logger.debug(
      `Context Menus: ${[...client.contextMenusRequested.values()].map((x) => x.name).join(', ') || 'None'}`,
    );
  } catch (e) {
    logger.error({ error: e }, `ERROR | Failed to register commands.`, 'command-registration');
  }
}
