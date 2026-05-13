import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  ContextMenuCommandBuilder,
  InteractionContextType,
} from 'discord.js';
import { ContextMenuHandler } from '../../../types/index.js';
import { EndfieldProfile } from '../../helper/Endfield/Profile.js';

export default {
  status: true,
  metadata: new ContextMenuCommandBuilder()
    .setName('Endfield Profile')
    .setType(ApplicationCommandType.User)
    .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM])
    .setIntegrationTypes([
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ]),
  run: async function (int) {
    await int.SendOrEdit(true);

    return EndfieldProfile(int, await int.client.users.fetch(int.interaction.targetId));
  },
} as ContextMenuHandler;
