import { AnySelectMenuInteraction } from 'discord.js';
import BotClient from '../../BotClient.js';
import BaseInteraction from './_baseInteraction.js';

class SelectMenuInteraction<T extends AnySelectMenuInteraction> extends BaseInteraction<T> {
  constructor(client: BotClient, interaction: T) {
    super(client, interaction);
  }
}

export default SelectMenuInteraction;
