import {
  AnySelectMenuInteraction,
  AutocompleteInteraction,
  ButtonInteraction,
  CommandInteraction,
  ContextMenuCommandInteraction,
  InteractionReplyOptions,
  MessageFlags,
  ModalSubmitInteraction,
} from 'discord.js';
import BotClient from '../../BotClient.js';

class BaseInteraction<
  AnyInteraction extends
    | CommandInteraction
    | AutocompleteInteraction
    | ButtonInteraction
    | ModalSubmitInteraction
    | ContextMenuCommandInteraction
    | AnySelectMenuInteraction,
> {
  client: BotClient;
  interaction: AnyInteraction;

  constructor(client: BotClient, interaction: AnyInteraction) {
    this.client = client;
    this.interaction = interaction;
  }

  /**
   * A method to send a reply to the interaction or edit the reply if it has already been replied to or deferred.
   * @param msg The content to send as a reply, or an InteractionReplyOptions object for additional options. If msg is a boolean, it will be treated as the ephemeral flag for deferring the reply.
   * @param options If msg is a string, this can be either a boolean indicating whether the reply should be ephemeral or an InteractionReplyOptions object for additional options. If msg is an InteractionReplyOptions object, this parameter can be used to specify whether the reply should be ephemeral.
   * @param ephemeral Whether the reply should be ephemeral. This parameter is only used if msg is a string or if options is an InteractionReplyOptions object.
   * @returns A promise that resolves to the sent or edited message, or void if the interaction is not repliable.
   */
  async SendOrEdit(
    msg: string | boolean | InteractionReplyOptions,
    options?: boolean | InteractionReplyOptions,
    ephemeral: boolean = false,
  ) {
    const int = this.interaction;

    if (!int.isRepliable()) return;

    const ephemeralFlag = (bool: boolean) => (bool ? MessageFlags.Ephemeral : undefined);

    if (int.replied || int.deferred) {
      // Ephemeral is not working in editReply.
      if (typeof msg === 'boolean')
        throw new Error(`The interaction has already been replied to or deferred.`);
      if (typeof msg === 'object') {
        return int.editReply({
          ...msg,
          flags: undefined,
        });
      } else if (typeof options === 'object')
        return int.editReply({
          ...options,
          content: msg,
          flags: undefined,
        });
      else
        return int.editReply({
          content: msg,
        });
    } else {
      if (typeof msg === 'boolean') return int.deferReply({ flags: ephemeralFlag(msg) });
      else if (typeof msg === 'object') {
        if (typeof options === 'boolean')
          return int.reply({ ...msg, flags: ephemeralFlag(options) });
        else return int.reply({ flags: ephemeralFlag(ephemeral), ...msg });
      } else if (typeof options === 'boolean')
        return int.reply({
          content: msg,
          flags: ephemeralFlag(options),
        });
      else if (typeof options === 'object')
        return int.reply({
          ...options,
          content: msg,
          flags: ephemeralFlag(ephemeral),
        });
      else
        return int.reply({
          content: msg,
          flags: ephemeralFlag(ephemeral),
        });
    }
  }
}

export default BaseInteraction;
