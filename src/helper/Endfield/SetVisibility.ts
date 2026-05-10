import { MessageFlags } from 'discord.js';
import EndfieldModel from '../../models/Endfield.js';
import ButtonInteraction from '../../utilities/interaction/button.interaction.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';
import ContextMenuInteraction from '../../utilities/interaction/contextmenu.interaction.js';

/**
 * Handles the visibility setting for the Endfield profile.
 * @param int The command interaction object.
 * @param visibility The desired visibility status (`public` or `private`). If not provided, the visibility will be toggled.
 * @returns A promise that resolves when the visibility has been updated.
 */
export async function EndfieldSetVisibility(
  int: CommandInteraction | ButtonInteraction | ContextMenuInteraction,
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

  const msg = [
    `Your Endfield profile visibility has been successfully updated to \`${newVisibility}\`.`,
    newVisibility === 'public'
      ? `-# Tips: You can set back to private by clicking the button again or using the command ${int.client.mentionSlashCommand('endfield set-visibility')}.`
      : '',
  ].join('\n');

  // If the interaction is component v2, should use followUp to avoid "Interaction failed"
  // message, and make the response ephemeral. Otherwise, use SendOrEdit as usual.
  if (await int.isComponentV2()) {
    return int.interaction.followUp({ content: msg, flags: MessageFlags.Ephemeral });
  } else {
    return int.SendOrEdit(msg);
  }
}
