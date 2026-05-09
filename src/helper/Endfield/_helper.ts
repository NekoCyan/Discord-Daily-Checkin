import {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from 'discord.js';
import EndfieldService from '../../services/endfield.service.js';

export function EndfieldUserSection(
  container: ContainerBuilder,
  userInfo: Awaited<ReturnType<EndfieldService['getEndfieldUserInfo']>>,
  avatarURL?: string,
) {
  const section = new SectionBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`### UID: ${userInfo.userId}`),
    new TextDisplayBuilder().setContent(`## ${userInfo.nickname} (level ${userInfo.level})`),
    new TextDisplayBuilder().setContent(`Server: ${userInfo.serverName} (${userInfo.serverType})`),
  );
  if (avatarURL) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarURL));
  return container.addSectionComponents(section);
}

export function EndfieldSeparator(container: ContainerBuilder) {
  return container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );
}

export function EndfieldRewardSection(
  container: ContainerBuilder,
  reward: {
    name: string;
    count: number;
    icon: string;
    id: string;
  },
) {
  const section = new SectionBuilder()
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(reward.icon))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${reward.name} (x${reward.count})`),
      new TextDisplayBuilder().setContent(`-# ${reward.id}`),
    );
  return container.addSectionComponents(section);
}

export function EndfieldTextDisplay(container: ContainerBuilder, content: string) {
  return container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
}

export function EndfieldProfilePrivateNotice(
  container: ContainerBuilder,
  withToggleButton = false,
) {
  const section = new SectionBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent('-# *This profile is private. Only you can see it.*'),
  );
  if (withToggleButton) {
    section.setButtonAccessory(
      new ButtonBuilder()
        .setCustomId('endfield-toggle-profile-visibility')
        .setLabel('Change Profile Visibility')
        .setStyle(ButtonStyle.Primary),
    );
  }
  return container.addSectionComponents(section);
}
