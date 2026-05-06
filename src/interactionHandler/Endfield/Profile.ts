import {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  User,
} from 'discord.js';
import { ServiceError } from '../../errors/ServiceError.js';
import EndfieldModel from '../../models/Endfield.js';
import EndfieldService from '../../services/endfield.service.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';
import ContextMenuInteraction from '../../utilities/interaction/contextmenu.interaction.js';
import {
  EndfieldRewardSection,
  EndfieldSeparator,
  EndfieldTextDisplay,
  EndfieldUserSection,
} from './_helper.js';

export async function EndfieldProfile(
  int: CommandInteraction | ContextMenuInteraction,
  target: User,
): Promise<unknown> {
  if (await int.PreventCommandOnBot(target)) return;
  const isSelf = target.id === int.interaction.user.id;

  const endfieldModel = await EndfieldModel.getOrCreate(target.id);

  // Check if account token is set.
  if (!endfieldModel.accountToken)
    return int.SendOrEdit(
      isSelf
        ? `You have not set your Endfield account token yet. Please use ${int.client.mentionSlashCommand('endfield set-account-token')} to set it.`
        : `${target.toString()} has not set their Endfield account token yet.`,
    );
  // Check if public.
  if (!endfieldModel.isPublic && !isSelf)
    return int.SendOrEdit(`${target.toString()} has set their profile to private.`);

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
      const selfErrMsg = `Your Endfield account token is no more valid, as it will be removed from your Discord account. Please update it by using ${int.client.mentionSlashCommand('endfield set-account-token')}.`;
      let errMsg: string;
      if (isSelf) {
        errMsg = selfErrMsg;
      } else {
        errMsg = `Failed to fetch ${target.toString()}'s Endfield profile because their account token is no more valid.`;
        await target.send(selfErrMsg).catch(() => null);
      }

      return int.SendOrEdit(errMsg);
    }

    isError = true;
  } else if (err instanceof Error) {
    // Such as network error, etc.
    isError = true;
  }
  // If it's other error, just show the error message.
  if (isError) {
    logger.error({ err }, `Failed to fetch Endfield profile for user ${target.id} due to error:`);
    return int.SendOrEdit(
      [
        `Failed to fetch ${isSelf ? 'your' : `${target.toString()}'s`} Endfield profile, please try again later.`,
        `If the problem persists, please contact the bot administrator for more information.`,
      ].join('\n'),
    );
  }

  const [userInfo, userCheckin] = await Promise.all([
    service.getEndfieldUserInfo(),
    service.getCheckInInfo(),
  ]);

  // Render section.
  const container = new ContainerBuilder();

  // Header.
  const skportUserAvatar = service.skportUser?.user.basicUser.avatar;
  const headerSection = EndfieldUserSection(userInfo, skportUserAvatar);
  container.addSectionComponents(headerSection);
  // Separator.
  container.addSeparatorComponents(EndfieldSeparator());
  // Today's rewards.
  container.addTextDisplayComponents(
    EndfieldTextDisplay(`> ## Today's Rewards (Day ${userCheckin.currentDay}):`),
  );
  userCheckin.todayRewards.forEach((reward) => {
    container.addSectionComponents(EndfieldRewardSection(reward));
  });
  // Separator.
  container.addSeparatorComponents(EndfieldSeparator());
  // Tomorrow's rewards.
  container.addTextDisplayComponents(EndfieldTextDisplay("> ## Tomorrow's Rewards:"));
  const tmrRewards = userCheckin.tomorrowRewards;
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
  const nextCheckinTS = Math.floor(userCheckin.nextDayTimestamp / 1000);
  container.addTextDisplayComponents(
    EndfieldTextDisplay(
      [
        `Today check-in status: ${userCheckin.isTodayChecked ? '✅ Checked in' : '❌ Not checked in yet'}.`,
        `Next check-in time: <t:${nextCheckinTS}:R> (<t:${nextCheckinTS}:F>).`,
      ].join('\n'),
    ),
  );

  // If the current profile is private, add a button to toggle visibility.
  if (isSelf && !endfieldModel.isPublic) {
    // Separator.
    container.addSeparatorComponents(EndfieldSeparator());

    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          EndfieldTextDisplay('-# *This profile is private. Only you can see it.*'),
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId('endfield-toggle-profile-visibility')
            .setLabel('Change Profile Visibility')
            .setStyle(ButtonStyle.Primary),
        ),
    );
  }

  return Promise.all([
    int.SendOrEdit({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }),
    endfieldModel.updateOnChange(service.toObject()),
  ]);
}
