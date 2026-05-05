import { Interaction } from 'discord.js';
import { EventHandler } from '../../../types/index.js';
import AutoCompleteInteraction from '../../utilities/interaction/autocomplete.interaction.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';
import ContextMenuInteraction from '../../utilities/interaction/contextmenu.interaction.js';

export default {
  status: true,
  once: false,
  run: async function (client, interaction) {
    if (!client.isFullyReady || interaction.user.bot) return; // Maybe somehow the bot can interact it xd.

    if (interaction.isChatInputCommand()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (!command) return;

      const commandInteraction = new CommandInteraction(client, interaction);

      try {
        await command.run(commandInteraction);
      } catch (err) {
        logger.error(
          { err, command: interaction.commandName },
          `Error executing slash command ${interaction.commandName}`,
        );
        return;
      }
    } else if (interaction.isAutocomplete()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (!command) return;
      if (typeof command?.autoComplete !== 'function') return;

      const autoCompleteInteraction = new AutoCompleteInteraction(client, interaction);

      try {
        await command.autoComplete(autoCompleteInteraction);
      } catch (err) {
        logger.error(
          { err, command: interaction.commandName },
          `Error executing autocomplete for slash command ${interaction.commandName}`,
        );
        return;
      }
    } else if (interaction.isButton()) {
      // For now, we don't have any button interactions, so just silent it.
      return;
    } else if (interaction.isModalSubmit()) {
      // For now, we don't have any modal interactions, so just silent it.
      return;
    } else if (interaction.isContextMenuCommand()) {
      const contextMenu = client.contextMenus.get(interaction.commandName);
      if (!contextMenu) return;

      const contextMenuInteraction = new ContextMenuInteraction(client, interaction);

      try {
        await contextMenu.run(contextMenuInteraction);
      } catch (err) {
        logger.error(
          { err, command: interaction.commandName },
          `Error executing context menu ${interaction.commandName}`,
        );
        return;
      }
    } else if (interaction.isAnySelectMenu()) {
      // For now, we don't have any select menu interactions, so just silent it.
      return;
    } else {
      logger.warn(
        { type: interaction.type },
        `Received unsupported interaction type. Consider adding support for it.`,
      );
      return;
    }
  },
} as EventHandler<[Interaction]>;
