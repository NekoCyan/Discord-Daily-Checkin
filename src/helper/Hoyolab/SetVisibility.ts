import HoyolabModel from '../../models/Hoyolab.js';
import ButtonInteraction from '../../utilities/interaction/button.interaction.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';
import ContextMenuInteraction from '../../utilities/interaction/contextmenu.interaction.js';

/**
 * Handles the visibility setting for the Hoyolab profile.
 * @param int The command interaction object.
 * @param visibility The desired visibility status (`public` or `private`). If not provided, the visibility will be toggled.
 * @returns A promise that resolves when the visibility has been updated.
 */
export async function HoyolabSetVisibility(
  int: CommandInteraction | ButtonInteraction | ContextMenuInteraction,
  visibility?: string,
): Promise<unknown> {
  if (visibility && !['public', 'private'].includes(visibility))
    await int.SendOrEdit('Invalid visibility option. Please choose either `public` or `private`.');

  const model = await HoyolabModel.getOrCreate(int.interaction.user.id);

  // If visibility is not provided, toggle the current visibility.
  const newVisibility = visibility || (model.isPublic ? 'private' : 'public');

  await model.updateOnChange({
    isPublic: newVisibility === 'public',
  });

  const msg = [
    `Your Hoyolab profile visibility has been successfully updated to \`${newVisibility}\`.`,
    newVisibility === 'public'
      ? `-# Tips: You can set back to private by clicking the button again or using the command ${int.client.mentionSlashCommand('hoyolab set-visibility')}.`
      : '',
  ].join('\n');

  // If the interaction is component v2, should use followUp to avoid "Interaction failed"
  // message, and make the response ephemeral. Otherwise, use SendOrEdit as usual.
  if (await int.isComponentV2()) {
    return int.followUp(msg, true);
  } else {
    return int.SendOrEdit(msg);
  }
}
