import {
  ApplicationIntegrationType,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommandHandler } from '../../../types/index.js';
import { EndfieldProfile } from '../../interactionHandler/Endfield/Profile.js';
import {
  EndfieldHowToGetAccountToken,
  EndfieldSetAccountToken,
} from '../../interactionHandler/Endfield/index.js';

export default {
  status: true,
  metadata: new SlashCommandBuilder()
    .setName('endfield')
    .setDescription('A related endfield commands.')
    .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM])
    .setIntegrationTypes([
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ])
    .addSubcommand((sub) =>
      sub
        .setName('profile')
        .setDescription('Show the Endfield in-game profile and check-in.')
        .addUserOption((opt) =>
          opt
            .setName('target')
            .setDescription('Specifies the user that you want to see.')
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) => sub.setName('checkin').setDescription('Manually do check-in.'))
    .addSubcommand((sub) =>
      sub
        .setName('set-account-token')
        .setDescription(
          'Set the account token for Endfield (Automatically daily once after successful set).',
        )
        .addStringOption((opt) =>
          opt
            .setName('token')
            .setDescription(
              'The account token you get from Website (leave empty to see how to get it).',
            )
            .setMinLength(0)
            .setMaxLength(100)
            .setRequired(false),
        ),
    ),
  run: async function (int) {
    const inDevelopment = () =>
      int.SendOrEdit('This command is still in development. Please wait for the next update!');

    await int.SendOrEdit(true);
    const subCommand = int.interaction.options.getSubcommand();

    switch (subCommand) {
      case 'profile': {
        const target = int.interaction.options.getUser('target') ?? int.interaction.user;
        return EndfieldProfile(int, target);
      }
      case 'checkin': {
        await inDevelopment();
        break;
      }
      case 'set-account-token': {
        const token = int.interaction.options.getString('token');
        if (!token) {
          await EndfieldHowToGetAccountToken(int);
        } else {
          await EndfieldSetAccountToken(int, token);
        }
        break;
      }
    }

    return;
  },
} as SlashCommandHandler;
