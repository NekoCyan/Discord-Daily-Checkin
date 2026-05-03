import { ChatInputCommandInteraction } from 'discord.js';
import BotClient from '../../BotClient.js';
import BaseInteraction from './_baseInteraction.js';

export default class CommandInteraction extends BaseInteraction<ChatInputCommandInteraction> {
  constructor(client: BotClient, interaction: ChatInputCommandInteraction) {
    super(client, interaction);
  }
}
