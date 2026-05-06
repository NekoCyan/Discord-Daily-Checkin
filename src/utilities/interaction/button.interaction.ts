import { ButtonInteraction as ButtonCommandInteraction } from 'discord.js';
import BotClient from '../../BotClient.js';
import BaseInteraction from './_baseInteraction.js';

class ButtonInteraction extends BaseInteraction<ButtonCommandInteraction> {
  constructor(client: BotClient, interaction: ButtonCommandInteraction) {
    super(client, interaction);
  }
}

export default ButtonInteraction;
