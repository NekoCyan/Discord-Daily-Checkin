import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  ContextMenuCommandBuilder,
  InteractionContextType,
} from 'discord.js';
import { ContextMenuHandler } from '../../../types/index.js';
import { HoyolabProfile } from '../../helper/Hoyolab/Profile.js';

export default {
  status: true,
  metadata: new ContextMenuCommandBuilder()
    .setName('Hoyolab Profile')
    .setType(ApplicationCommandType.User)
    .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM])
    .setIntegrationTypes([
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ]),
  run: async function (int) {
    await int.SendOrEdit(true);

    return HoyolabProfile(int, await int.client.users.fetch(int.interaction.targetId));
  },
} as ContextMenuHandler;
