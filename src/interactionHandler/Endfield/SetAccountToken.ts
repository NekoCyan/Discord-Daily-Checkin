import EndfieldModel from '../../models/Endfield.js';
import EndfieldService from '../../services/endfield.service.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';
import { truncateMiddle } from '../../utilities/Utils.js';

export async function EndfieldSetAccountToken(
  int: CommandInteraction,
  accountToken: string,
): Promise<unknown> {
  // Check if the token is valid before saving it
  const service = new EndfieldService({ accountToken });
  const isValid = await service.IsValidAccountToken();
  if (!isValid)
    return int.SendOrEdit(
      'The account token you provided is invalid. Please double-check and try again.',
    );

  // Save the valid token to the database
  const endfieldModel = await EndfieldModel.getOrCreate(int.interaction.user.id);

  // Before saving, daily once.
  const checkIn = await service.getCheckInInfo();
  if (!checkIn.isTodayChecked) await service.doCheckIn();

  // Update the database with the new token and reset other related fields if needed.
  endfieldModel.markLastDailyAsToday(false);
  await endfieldModel.updateOnChange(service.toObject(), false);
  await endfieldModel.save(); // Manual save to ensure all field (includes lastDailyChecked) are updated in database.

  return int.SendOrEdit(
    `Your endfield account token has been successfully updated! \`\`${truncateMiddle(accountToken, 4, 4)}\`\``,
  );
}
