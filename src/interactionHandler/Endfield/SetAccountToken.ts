import EndfieldModel from '../../models/Endfield.js';
import EndfieldService from '../../services/endfield.service.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';
import { truncateMiddle } from '../../utilities/Utils.js';

export async function EndfieldSetAccountToken(int: CommandInteraction, accountToken: string) {
  // Check if the token is valid before saving it
  const service = new EndfieldService({ accountToken });
  const isValid = await service.IsValidAccountToken();
  if (!isValid) {
    await int.SendOrEdit(
      'The account token you provided is invalid. Please double-check and try again.',
    );
    return;
  }

  // Save the valid token to the database
  const endfieldModel = await EndfieldModel.getOrCreate(int.interaction.user.id);

  // Before saving, daily once.
  const checkIn = await service.getCheckInInfo();
  if (!checkIn.isTodayChecked) {
    await service.doCheckIn();

    // It will be automatically updated in the database in the below.
    endfieldModel.markLastDailyAsToday(false);
  }

  await endfieldModel.updateOnChange(service.toObject(), true);

  await int.SendOrEdit(
    `Your account token has been successfully updated! \`\`${truncateMiddle(accountToken, 4, 4)}\`\``,
  );
  return;
}
