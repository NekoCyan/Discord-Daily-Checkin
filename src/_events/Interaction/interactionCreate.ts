import { Interaction } from 'discord.js';
import { EventHandler } from '../../../types/index.js';
import AutoCompleteInteraction from '../../utilities/interaction/autocomplete.interaction.js';
import ButtonInteraction from '../../utilities/interaction/button.interaction.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';
import ContextMenuInteraction from '../../utilities/interaction/contextmenu.interaction.js';
import SelectMenuInteraction from '../../utilities/interaction/selectmenu.interaction.js';

const somethingWentWrongMsg = `Something went wrong while executing the interaction. Please try again later or contact bot administrator for more information.`;

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
        await commandInteraction.SendOrEdit(somethingWentWrongMsg, true);
        return;
      }
    } else if (interaction.isAutocomplete()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (!command || typeof command.autoComplete !== 'function') return;

      const autoCompleteInteraction = new AutoCompleteInteraction(client, interaction);

      try {
        await command.autoComplete(autoCompleteInteraction);
      } catch (err) {
        logger.error(
          { err, command: interaction.commandName },
          `Error executing autocomplete for slash command ${interaction.commandName}`,
        );
        await autoCompleteInteraction.interaction.respond([
          {
            name: `An error occurred... try again later.`,
            value: '_',
          },
        ]);
        return;
      }
    } else if (interaction.isButton()) {
      const button = client.buttons.get(interaction.customId);
      if (!button) return;

      const buttonInteraction = new ButtonInteraction(client, interaction);

      try {
        await button.run(buttonInteraction);
      } catch (err) {
        logger.error(
          { err, customId: interaction.customId },
          `Error executing button with custom ID ${interaction.customId}`,
        );
        await buttonInteraction.SendOrEdit(somethingWentWrongMsg, true);
        return;
      }
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
        await contextMenuInteraction.SendOrEdit(somethingWentWrongMsg, true);
        return;
      }
    } else if (interaction.isAnySelectMenu()) {
      const selectMenu = client.selectMenus.get(interaction.customId);
      if (!selectMenu) return;

      const selectMenuInteraction = new SelectMenuInteraction(client, interaction);

      try {
        await selectMenu.run(selectMenuInteraction);
      } catch (err) {
        logger.error(
          { err, customId: interaction.customId },
          `Error executing select menu with custom ID ${interaction.customId}`,
        );
        await selectMenuInteraction.SendOrEdit(somethingWentWrongMsg, true);
        return;
      }
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
