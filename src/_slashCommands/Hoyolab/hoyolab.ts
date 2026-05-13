import {
  ApplicationIntegrationType,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommandHandler } from '../../../types/index.js';
import { HoyolabResetCookie } from '../../helper/Hoyolab/ResetCookie.js';
import { HoyolabSetCookie } from '../../helper/Hoyolab/SetCookie.js';
import { HoyolabSetupWizard } from '../../helper/Hoyolab/SetupWizard.js';
import HoyolabModel from '../../models/Hoyolab.js';
import { cookieStringify } from '../../utilities/Utils.js';

export default {
  status: true,
  metadata: new SlashCommandBuilder()
    .setName('hoyolab')
    .setDescription('A related Hoyolab (Hoyoverse Games) commands.')
    .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM])
    .setIntegrationTypes([
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ])
    .addSubcommand((sub) =>
      sub
        .setName('profile')
        .setDescription('Show the Hoyoverse Games check-in profile.')
        .addUserOption((opt) =>
          opt
            .setName('target')
            .setDescription('Specifies the user that you want to see.')
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('checkin').setDescription('Manually do check-in for selected Hoyoverse Games.'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('set-cookie')
        .setDescription(
          '[Method 1] Set the cookie for Hoyoverse Games (Automatically daily once after completely setup).',
        )
        .addStringOption((opt) =>
          opt
            .setName('cookie')
            .setDescription("The account cookie you've got.")
            .setMinLength(0)
            .setMaxLength(300)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('set-cookie-2')
        .setDescription(
          '[Method 2] Set the cookie for Hoyoverse Games (Automatically daily once after completely setup).',
        )
        .addStringOption((opt) =>
          opt
            .setName('ltoken_v2')
            .setDescription("Account cookie ltoken_v2 you've got.")
            .setMinLength(0)
            .setMaxLength(300)
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName('ltuid_v2')
            .setDescription("Account cookie ltuid_v2 you've got.")
            .setMinLength(0)
            .setMaxLength(100)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete-cookie')
        .setDescription('Delete/Remove account cookie from your Discord account.'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('setup-wizard')
        .setDescription(
          'Start a setup wizard to help you setup game for daily check-in or language preferences.',
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('set-visibility')
        .setDescription(
          'Set the visibility of your Hoyoverse Games profile if you want the other users to see it.',
        )
        .addStringOption((opt) =>
          opt
            .setName('visibility')
            .setDescription('The visibility of your Hoyoverse Games profile.')
            .setRequired(true)
            .setAutocomplete(true),
        ),
    ),
  run: async function (int) {
    await int.SendOrEdit(true);
    const subCommand = int.interaction.options.getSubcommand();

    const underDevelopment = () =>
      int.SendOrEdit('This feature is still under development. Please stay tuned for updates!');

    switch (subCommand) {
      case 'profile': {
        // const target = int.interaction.options.getUser('target') ?? int.interaction.user;
        await underDevelopment();
        break;
      }
      case 'checkin': {
        // await EndfieldDoCheckIn(int.client, int.interaction.user, int);
        await underDevelopment();
        break;
      }
      case 'set-cookie': {
        const cookie = int.interaction.options.getString('cookie', true);
        await HoyolabSetCookie(int, cookie);
        break;
      }
      case 'set-cookie-2': {
        const ltoken_v2 = int.interaction.options.getString('ltoken_v2', true);
        const ltuid_v2 = int.interaction.options.getString('ltuid_v2', true);
        await HoyolabSetCookie(int, cookieStringify({ ltoken_v2, ltuid_v2 }));
        break;
      }
      case 'delete-cookie': {
        await HoyolabResetCookie(int);
        break;
      }
      case 'setup-wizard': {
        await HoyolabSetupWizard(int);
        break;
      }
      case 'set-visibility': {
        // const visibility = int.interaction.options.getString('visibility');
        await underDevelopment();
        break;
      }
    }

    return;
  },
  autoComplete: async function (int) {
    const isPublic = (await HoyolabModel.getOrCreate(int.interaction.user.id)).isPublic;

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
