import { ContainerBuilder, MessageFlags, User } from 'discord.js';
import EndfieldModel from '../../models/Endfield.js';
import EndfieldService from '../../services/endfield.service.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';
import ContextMenuInteraction from '../../utilities/interaction/contextmenu.interaction.js';
import {
  EndfieldRewardSection,
  EndfieldSeparator,
  EndfieldTextDisplay,
  EndfieldUserSection,
} from './helper.js';

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

  return Promise.all([
    int.SendOrEdit({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }),
    endfieldModel.updateOnChange(service.toObject()),
  ]);
}
