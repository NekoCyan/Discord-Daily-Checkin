import { ContainerBuilder, MessageFlags, User } from 'discord.js';
import BotClient from '../../BotClient.js';
import { ServiceError } from '../../errors/ServiceError.js';
import EndfieldModel from '../../models/Endfield.js';
import EndfieldService from '../../services/endfield.service.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';
import { Separator, TextDisplay } from '../_helper.js';
import { EndfieldTodayRewardSection, EndfieldTomorrowRewardSection } from './_helper.js';

/**
 * Handle the check-in process for Endfield, including token validation and database updates.
 * @param client The bot client instance.
 * @param user The Discord user performing the check-in.
 * @param int [optional] Interaction object from the command. If none provided, it should me automatically claim/do request checkin/daily.
 * @returns
 */
export async function EndfieldDoCheckIn(
  client: BotClient,
  user: User,
  int?: CommandInteraction,
): Promise<unknown> {
  const endfieldModel = await EndfieldModel.getOrCreate(user.id);

  if (int && !endfieldModel.accountToken)
    return int.SendOrEdit(
      `You have not set your Endfield account token yet. Please use ${client.mentionSlashCommand('endfield set-account-token')} to set it.`,
    );

  const service = new EndfieldService({
    accountToken: endfieldModel.accountToken,
    cred: endfieldModel.cred,
  });

  const err = await service.revalidateCredAndFetchUser().catch((e: ServiceError | Error) => e);
  let isError = false;
  // Check error details.
  if (err instanceof ServiceError) {
    // Check if it's unauthorized error, if so, reset the account token and cred in database, and ask user to set account token again.
    const isUnauthorized = await service.IsValidAccountToken();
    if (!isUnauthorized) {
      await endfieldModel.resetOnUnauthorized();

      // If not self, show the error to the command invoker, also notify the target user about the invalid token.
      const selfErrMsg = `Your Endfield account token is no more valid, as it will be removed from your Discord account. Please update it by using ${client.mentionSlashCommand('endfield set-account-token')}.`;
      if (int) return int.SendOrEdit(selfErrMsg);
      else return user.send(selfErrMsg).catch(() => null);
    }

    isError = true;
  } else if (err instanceof Error) {
    // Such as network error, etc.
    isError = true;
  }
  // If it's other error, just show the error message.
  if (isError) {
    logger.error({ err }, `Failed to do check-in for user ${user.id} due to error:`);
    if (int)
      await int.SendOrEdit(
        [
          `Failed to do check-in for your Endfield account, please try again later.`,
          `If the problem persists, please contact the bot administrator for more information.`,
        ].join('\n'),
      );
    return;
  }

  // Get info before check-in.
  const checkInInfo = await service.getCheckInInfo();
  const nextDayTS = Math.floor(checkInInfo.nextDayTimestamp / 1000);
  const nextCheckInTime = `Next check-in time: <t:${nextDayTS}:R> (<t:${nextDayTS}:F>).`;
  if (checkInInfo.isTodayChecked) {
    // Save once per instace if already checked in, and update the rest if needed.
    await endfieldModel.markLastDailyAsToday(false);
    await endfieldModel.updateOnChange(service.toObject(), false);
    await endfieldModel.save(); // Manual save to ensure all field (includes lastDailyChecked) are updated in database.

    if (int)
      return int.SendOrEdit(
        [
          'You have already checked in today.',
          `If you want to see what you received today, use ${client.mentionSlashCommand('endfield profile')}.`,
          nextCheckInTime,
        ].join('\n'),
      );
    else
      return user
        .send(
          [
            '## Endfield check-in Skipped.',
            'Looks like you have already checked in today so skipped the check-in process.',
            `If you want to see what you received today, use ${client.mentionSlashCommand('endfield profile')}.`,
            nextCheckInTime,
          ].join('\n'),
        )
        .catch(() => null);
  }

  // So separate the saving process incase failed to do check-in next time.
  const checkedIn = await service.doCheckIn().catch(() => null);

  // Immediately update the database to and announce the result.
  await endfieldModel.markLastDailyAsToday(false);
  await endfieldModel.updateOnChange(service.toObject(), false);
  await endfieldModel.save(); // Manual save to ensure all field (includes lastDailyChecked) are updated in database.

  // When successful checked in, continue to update the database and no need to announce.
  if (checkedIn === true) return;
  // But incase failed to check in, should announce the failure and tell user to do manual check-in.
  if (checkedIn === null) {
    const onWeb = `[on the Website](<${EndfieldService.Constants.URLS.CHECKIN_WEB}>)`;
    const errMsg =
      'Failed to check-in to Endfield, possibly due to network issue or Endfield server issue.';
    if (int)
      return int.SendOrEdit(
        [errMsg, `Please try again command again or check-in manually ${onWeb}.`].join('\n'),
      );
    else
      return user
        .send(
          [
            errMsg,
            `Please try again with command ${client.mentionSlashCommand('endfield check-in')} or check-in manually ${onWeb}.`,
          ].join('\n'),
        )
        .catch((e) => e);
  }

  // Render section.
  const container = new ContainerBuilder();

  // Header.
  TextDisplay(container, `## Endfield check-in successful!`);
  // Separator.
  Separator(container);
  // Today's rewards.
  EndfieldTodayRewardSection(container, checkInInfo.currentDay, checkedIn.todayRewards);
  // Separator.
  Separator(container);
  // Tomorrow's rewards.
  EndfieldTomorrowRewardSection(container, checkInInfo.tomorrowRewards);
  // Separator.
  Separator(container);
  // Footer.
  TextDisplay(container, nextCheckInTime);

  if (int)
    return int.SendOrEdit({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  else
    return user
      .send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
}
