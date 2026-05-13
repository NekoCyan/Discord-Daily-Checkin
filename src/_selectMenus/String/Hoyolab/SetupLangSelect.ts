import { StringSelectMenuInteraction } from 'discord.js';
import { SelectMenuHandler } from '../../../../types/index.js';
import HoyolabModel from '../../../models/Hoyolab.js';

export default {
  status: true,
  id: 'hoyolab-setup-lang-select',
  run: async function (int) {
    const model = await HoyolabModel.getOrCreate(int.interaction.user.id);

    /**
     * Skip the check for valid cookie since language preference can be set even before
     * setting cookie and will not affect any functionality until the cookie is set.
     */
    if (!model)
      return int.SendOrEdit(
        `Your Hoyolab account is not set up yet. Please use the ${int.client.mentionSlashCommand('hoyolab set-cookie')} command to link your account before selecting games for daily check-in.`,
        true,
      );

    const lang = int.interaction.values[0]; // Array of selected language IDs as strings.
    if (!lang)
      return int.SendOrEdit(`No language was selected. Please select at least one language.`, true);

    await model.setLanguage(lang);
    await int.interaction.deferUpdate();
    return;
  },
} as SelectMenuHandler<StringSelectMenuInteraction>;
