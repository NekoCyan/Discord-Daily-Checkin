import { AutocompleteInteraction } from 'discord.js';
import BotClient from '../../BotClient.js';
import BaseInteraction from './_baseInteraction.js';

export default class AutoCompleteInteraction extends BaseInteraction<AutocompleteInteraction> {
  constructor(client: BotClient, interaction: AutocompleteInteraction) {
    super(client, interaction);
  }
}
