import { ContextMenuCommandInteraction } from 'discord.js';
import BotClient from '../../BotClient.js';
import BaseInteraction from './_baseInteraction.js';

class ContextMenuInteraction extends BaseInteraction<ContextMenuCommandInteraction> {
  constructor(client: BotClient, interaction: ContextMenuCommandInteraction) {
    super(client, interaction);
  }
}

export default ContextMenuInteraction;
