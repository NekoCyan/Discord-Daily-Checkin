import { StringSelectMenuInteraction } from 'discord.js';
import { SelectMenuHandler } from '../../../../types/index.js';
import HoyolabModel from '../../../models/Hoyolab.js';

export default {
  status: true,
  id: 'hoyolab-setup-game-select',
  run: async function (int) {
    const model = await HoyolabModel.getOrCreate(int.interaction.user.id);

    // If the user doesn't have a valid cookie, prompt them to set it first.
    if (!model || !model.isAccountSetted())
      return int.SendOrEdit(
        `Your Hoyolab account is not set up yet. Please use the ${int.client.mentionSlashCommand('hoyolab set-cookie')} command to link your account before selecting games for daily check-in.`,
        true,
      );

    const values = int.interaction.values; // Array of selected game IDs as strings.
    const gameIds = values.map((id) => parseInt(id)); // Convert to array of numbers.
    await model.setGameIdsToDailyCheck(gameIds);

    // todo: daily once for selected games.

    if (values.length === 0) {
      await int.SendOrEdit(
        [
          `Selected no game will result in no daily check-in and no game info shown in profile.`,
          `You can always come back to select games with ${int.client.mentionSlashCommand('hoyolab setup-wizard')}.`,
        ].join('\n'),
        true,
      );
    } else {
      await int.interaction.deferUpdate();
    }
    return;
  },
} as SelectMenuHandler<StringSelectMenuInteraction>;
