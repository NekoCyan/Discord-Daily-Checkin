import {
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from 'discord.js';
import EndfieldService from '../../services/endfield.service.js';

export function EndfieldUserSection(
  userInfo: Awaited<ReturnType<EndfieldService['getEndfieldUserInfo']>>,
  avatarURL?: string,
) {
  const section = new SectionBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`### UID: ${userInfo.userId}`),
    new TextDisplayBuilder().setContent(`## ${userInfo.nickname} (level ${userInfo.level})`),
    new TextDisplayBuilder().setContent(`Server: ${userInfo.serverName} (${userInfo.serverType})`),
  );
  if (avatarURL) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarURL));
  return section;
}

export function EndfieldSeparator() {
  return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
}

export function EndfieldRewardSection(reward: {
  name: string;
  count: number;
  icon: string;
  id: string;
}) {
  return new SectionBuilder()
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(reward.icon))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${reward.name} (x${reward.count})`),
      new TextDisplayBuilder().setContent(`-# ${reward.id}`),
    );
}

export function EndfieldTextDisplay(content: string) {
  return new TextDisplayBuilder().setContent(content);
}
