import HoyolabModel from '../../models/Hoyolab.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';

export async function HoyolabResetCookie(int: CommandInteraction): Promise<unknown> {
  const model = await HoyolabModel.getOrCreate(int.interaction.user.id);

  await model.resetOnUnauthorized();

  return int.SendOrEdit(
    `Your Hoyolab account token has been successfully deleted from your Discord account!`,
  );
}
