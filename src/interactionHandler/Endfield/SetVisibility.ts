import EndfieldModel from '../../models/Endfield.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';

export async function EndfieldSetVisibility(
  int: CommandInteraction,
  visibility?: string,
): Promise<unknown> {
  if (!['public', 'private'].includes(visibility ?? ''))
    await int.SendOrEdit('Invalid visibility option. Please choose either `public` or `private`.');

  // Save the valid token to the database
  const endfieldModel = await EndfieldModel.getOrCreate(int.interaction.user.id);
  await endfieldModel.updateOnChange({ isPublic: visibility === 'public' });

  return int.SendOrEdit(
    `Your Endfield profile visibility has been successfully updated to \`${visibility}\`.`,
  );
}
