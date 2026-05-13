import {
  ApplicationIntegrationType,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommandHandler } from '../../../types/index.js';
import { EndfieldDoCheckIn } from '../../helper/Endfield/DoCheckIn.js';
import { EndfieldProfile } from '../../helper/Endfield/Profile.js';
import {
  EndfieldResetAccountToken,
  EndfieldSetAccountToken,
  EndfieldSetVisibility,
} from '../../helper/Endfield/index.js';
import EndfieldModel from '../../models/Endfield.js';

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
            .setDescription("The account token you've got.")
            .setMinLength(0)
            .setMaxLength(100)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete-account-token')
        .setDescription('Delete/Remove account token from your Discord account.'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('set-visibility')
        .setDescription(
          'Set the visibility of your Endfield profile if you want the other users to see it.',
        )
        .addStringOption((opt) =>
          opt
            .setName('visibility')
            .setDescription('The visibility of your Endfield profile.')
            .setRequired(true)
            .setAutocomplete(true),
        ),
    ),
  run: async function (int) {
    await int.SendOrEdit(true);
    const subCommand = int.interaction.options.getSubcommand();

    switch (subCommand) {
      case 'profile': {
        const target = int.interaction.options.getUser('target') ?? int.interaction.user;
        await EndfieldProfile(int, target);
        break;
      }
      case 'checkin': {
        await EndfieldDoCheckIn(int.client, int.interaction.user, int);
        break;
      }
      case 'set-account-token': {
        const token = int.interaction.options.getString('token', true);
        await EndfieldSetAccountToken(int, token);
        break;
      }
      case 'delete-account-token': {
        await EndfieldResetAccountToken(int);
        break;
      }
      case 'set-visibility': {
        const visibility = int.interaction.options.getString('visibility');
        await EndfieldSetVisibility(int, visibility?.toLowerCase());
        break;
      }
    }

    return;
  },
  autoComplete: async function (int) {
    const isPublic = (await EndfieldModel.getOrCreate(int.interaction.user.id)).isPublic;

    const choices = [
      {
        name: 'Public' + (isPublic ? ' [Current state]' : ''),
        value: 'public',
      },
      {
        name: 'Private' + (!isPublic ? ' [Current state]' : ''),
        value: 'private',
      },
    ];
    // Reverse the order of choices if current state is public (put the current state at the bottom of list).
    if (isPublic) choices.reverse();

    await int.interaction.respond(choices);
    return;
  },
} as SlashCommandHandler;
