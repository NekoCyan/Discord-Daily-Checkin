import EndfieldModel from '../../models/Endfield.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';

export async function EndfieldResetAccountToken(int: CommandInteraction): Promise<unknown> {
  const endfieldModel = await EndfieldModel.getOrCreate(int.interaction.user.id);

  await endfieldModel.resetOnUnauthorized();

  return int.SendOrEdit(
    `Your endfield account token has been successfully revoked from your discord account!`,
  );
}
