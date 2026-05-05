import {
  AnySelectMenuInteraction,
  AutocompleteInteraction,
  ButtonInteraction,
  CommandInteraction,
  ContextMenuCommandInteraction,
  InteractionReplyOptions,
  MessageFlags,
  ModalSubmitInteraction,
  User,
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

    // Merges multiple flags together (e.g. Ephemeral | IsComponentsV2)
    const mergeFlags = (...flags: (MessageFlags | number | undefined)[]) => {
      const result = flags
        .filter((f): f is number => f !== undefined)
        .reduce((acc, f) => acc | f, 0);
      return result || undefined;
    };

    if (int.replied || int.deferred) {
      // Ephemeral is not working in editReply, so we strip it but keep other flags.
      if (typeof msg === 'boolean')
        throw new Error(`The interaction has already been replied to or deferred.`);
      if (typeof msg === 'object') {
        const { flags, ...rest } = msg;
        return int.editReply({
          ...rest,
          flags: mergeFlags(
            typeof flags === 'number' ? flags : undefined,
            // Strip ephemeral only
            ...(typeof flags === 'number' ? [flags & ~MessageFlags.Ephemeral] : []),
          ),
        });
      } else if (typeof options === 'object') {
        const { flags, ...rest } = options;
        return int.editReply({
          ...rest,
          content: msg,
          flags: typeof flags === 'number' ? flags & ~MessageFlags.Ephemeral : undefined,
        });
      } else return int.editReply({ content: msg });
    } else {
      if (typeof msg === 'boolean') return int.deferReply({ flags: ephemeralFlag(msg) });
      else if (typeof msg === 'object') {
        const { flags, ...rest } = msg;
        const resolvedEphemeral = typeof options === 'boolean' ? options : ephemeral;
        return int.reply({
          ...rest,
          flags: mergeFlags(
            typeof flags === 'number' ? flags : undefined,
            ephemeralFlag(resolvedEphemeral),
          ),
        });
      } else if (typeof options === 'boolean')
        return int.reply({ content: msg, flags: ephemeralFlag(options) });
      else if (typeof options === 'object') {
        const { flags, ...rest } = options;
        return int.reply({
          ...rest,
          content: msg,
          flags: mergeFlags(
            typeof flags === 'number' ? flags : undefined,
            ephemeralFlag(ephemeral),
          ),
        });
      } else return int.reply({ content: msg, flags: ephemeralFlag(ephemeral) });
    }
  }

  /**
   * A helper method to prevent commands on the bot if targetted, it will reply with an error
   * message if the target user is a bot.
   * @returns true if the interaction user is interacting to a bot, false otherwise.
   */
  async PreventCommandOnBot(userTarget: User) {
    if (userTarget.bot) {
      await this.SendOrEdit('Performing this action on a bot is not allowed.', true);
      return true;
    }
    return false;
  }
}

export default BaseInteraction;
