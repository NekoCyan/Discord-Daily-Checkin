import { ContainerBuilder, MessageFlags, User } from 'discord.js';
import BotClient from '../../BotClient.js';
import EndfieldModel from '../../models/Endfield.js';
import EndfieldService from '../../services/endfield.service.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';
import { EndfieldRewardSection, EndfieldSeparator, EndfieldTextDisplay } from './_helper.js';

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
  const isValid = await service.IsValidAccountToken();
  if (!isValid) {
    await endfieldModel.resetOnUnauthorized();
    const errMsg = `The Endfield account token you provided is no more valid, as it will be removed from your Discord account. Please update it by using ${client.mentionSlashCommand('endfield set-account-token')}.`;
    if (int) return int.SendOrEdit(errMsg);
    else user.send(errMsg).catch(() => null);
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
          `If you want to see what did you receive today, use ${client.mentionSlashCommand('endfield profile')}.`,
          nextCheckInTime,
        ].join('\n'),
      );
    else
      return user
        .send(
          [
            'Looks like you have already checked in today so skipped the check-in process.',
            nextCheckInTime,
          ].join('\n'),
        )
        .catch(() => null);
  }

  // So separate the saving process incase failed to do check-in next time.
  const checkedIn = await service.doCheckIn();

  // Immediately update the database to and announce the result.
  await endfieldModel.markLastDailyAsToday(false);
  await endfieldModel.updateOnChange(service.toObject(), false);
  await endfieldModel.save(); // Manual save to ensure all field (includes lastDailyChecked) are updated in database.

  if (checkedIn === true) return; // Successfully checked in, continue to update the database.

  // Render section.
  const container = new ContainerBuilder();

  // Header.
  container.addTextDisplayComponents(EndfieldTextDisplay(`## Check-in Successful!`));
  // Separator.
  container.addSeparatorComponents(EndfieldSeparator());
  // Today's rewards.
  container.addTextDisplayComponents(
    EndfieldTextDisplay(`> ## Today's Rewards (Day ${checkInInfo.currentDay}):`),
  );
  checkedIn.todayRewards.forEach((reward) => {
    container.addSectionComponents(EndfieldRewardSection(reward));
  });
  // Separator.
  container.addSeparatorComponents(EndfieldSeparator());
  // Tomorrow's rewards.
  container.addTextDisplayComponents(EndfieldTextDisplay("> ## Tomorrow's Rewards:"));
  const tmrRewards = checkedIn.tomorrowRewards;
  if (tmrRewards.length > 0) {
    tmrRewards.forEach((reward) => {
      container.addSectionComponents(EndfieldRewardSection(reward));
    });
  } else {
    container.addTextDisplayComponents(
      EndfieldTextDisplay('## *No rewards for tomorrow or waiting for next month refresh.*'),
    );
  }
  // Separator.
  container.addSeparatorComponents(EndfieldSeparator());
  // Footer.
  container.addTextDisplayComponents(EndfieldTextDisplay(nextCheckInTime));

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
