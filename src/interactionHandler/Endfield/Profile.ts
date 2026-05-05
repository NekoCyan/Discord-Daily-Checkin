import {
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
  User,
} from 'discord.js';
import EndfieldModel from '../../models/Endfield.js';
import EndfieldService from '../../services/endfield.service.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';
import ContextMenuInteraction from '../../utilities/interaction/contextmenu.interaction.js';

export async function EndfieldProfile(
  int: CommandInteraction | ContextMenuInteraction,
  target: User,
) {
  if (await int.PreventCommandOnBot(target)) return;
  const isSelf = target.id === int.interaction.user.id;

  const endfieldModel = await EndfieldModel.getOrCreate(target.id);

  // Check if account token is set.
  if (!endfieldModel.accountToken)
    return int.SendOrEdit(
      isSelf
        ? `You have not set your account token yet. Please use ${int.client.mentionSlashCommand('endfield set-account-token')} to set it.`
        : `${target.username} has not set their account token yet.`,
    );
  // Check if public.
  if (!endfieldModel.isPublic && !isSelf)
    return int.SendOrEdit(`${target.username} has set their profile to private.`);

  const service = new EndfieldService({
    accountToken: endfieldModel.accountToken,
    cred: endfieldModel.cred,
  });
  await service.revalidateCredAndFetchUser();

  const [userInfo, userCheckin] = await Promise.all([
    service.getEndfieldUserInfo(),
    service.getCheckInInfo(),
  ]);

  // Render section.
  const container = new ContainerBuilder();

  // Header.
  const headerSection = new SectionBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`### UID: ${userInfo.userId}`),
    new TextDisplayBuilder().setContent(`## ${userInfo.nickname} (level ${userInfo.level})`),
    new TextDisplayBuilder().setContent(`Server: ${userInfo.serverName} (${userInfo.serverType})`),
  );
  const skportUserAvatar = service.skportUser?.user.basicUser.avatar;
  if (skportUserAvatar)
    // Use SKPort avatar if available.
    headerSection.setThumbnailAccessory(new ThumbnailBuilder().setURL(skportUserAvatar));
  container.addSectionComponents(headerSection);
  // Separator.
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );
  // Today's rewards.
  const rewardBuilder = (reward: { name: string; count: number; icon: string; id: string }) =>
    new SectionBuilder()
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(reward.icon))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### ${reward.name} (x${reward.count})`),
        new TextDisplayBuilder().setContent(`-# ${reward.id}`),
      );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`> ## Today's Rewards (Day ${userCheckin.currentDay}):`),
  );
  userCheckin.todayRewards.forEach((reward) => {
    container.addSectionComponents(rewardBuilder(reward));
  });
  // Separator.
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );
  // Tomorrow's rewards.
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent("> ## Tomorrow's Rewards:"),
  );
  const tmrRewards = userCheckin.tomorrowRewards;
  if (tmrRewards.length > 0) {
    tmrRewards.forEach((reward) => {
      container.addSectionComponents(rewardBuilder(reward));
    });
  } else {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '## *No rewards for tomorrow or waiting for next month refresh.*',
      ),
    );
  }
  // Separator.
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );
  // Footer.
  const nextCheckinTS = Math.floor(userCheckin.nextDayTimestamp / 1000);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `Today check-in status: ${userCheckin.isTodayChecked ? '✅ Checked in' : '❌ Not checked in yet'}.`,
        `Next check-in time: <t:${nextCheckinTS}:R> (<t:${nextCheckinTS}:F>).`,
      ].join('\n'),
    ),
  );

  await Promise.all([
    int.SendOrEdit({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }),
    endfieldModel.updateOnChange(service.toObject(), true),
  ]);
  return;
}
