import EndfieldModel from '../../models/Endfield.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';

/**
 * Handles the visibility setting for the Endfield profile.
 * @param int The command interaction object.
 * @param visibility The desired visibility status (`public` or `private`). If not provided, the visibility will be toggled.
 * @returns A promise that resolves when the visibility has been updated.
 */
export async function EndfieldSetVisibility(
  int: CommandInteraction,
  visibility?: string,
): Promise<unknown> {
  if (visibility && !['public', 'private'].includes(visibility))
    await int.SendOrEdit('Invalid visibility option. Please choose either `public` or `private`.');

  const endfieldModel = await EndfieldModel.getOrCreate(int.interaction.user.id);

  // If visibility is not provided, toggle the current visibility.
  const newVisibility = visibility || (endfieldModel.isPublic ? 'private' : 'public');

  await endfieldModel.updateOnChange({
    isPublic: newVisibility === 'public',
  });

  return int.SendOrEdit(
    `Your Endfield profile visibility has been successfully updated to \`${newVisibility}\`.`,
  );
}
