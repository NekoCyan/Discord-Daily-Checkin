import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import HoyolabService from '../../services/hoyolab.service.js';
import { TextDisplay } from '../_helper.js';

type GameRecordCard = Awaited<ReturnType<HoyolabService['getGameRecordCard']>>['list'][number];

export function HoyolabGameSelectMenu(
  container: ContainerBuilder,
  games: GameRecordCard[],
  selectedGameIds: number[] = [],
) {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('hoyolab-setup-game-select')
    .setPlaceholder('Choose games to check-in daily...')
    .setMinValues(0)
    .setMaxValues(games.length)
    .addOptions(
      games.map((game) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(game.game_name)
          .setDescription(`${game.nickname} (level ${game.level})`)
          .setValue(String(game.game_id))
          .setDefault(selectedGameIds.includes(game.game_id)),
      ),
    );

  return container.addActionRowComponents(
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
  );
}

export function HoyolabLangSelectMenu(container: ContainerBuilder, currentLang: string = 'en-us') {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('hoyolab-setup-lang-select')
    .setPlaceholder('Choose a language...')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      HoyolabService.Constants.LANGS.map(({ name, label, value }) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${name} (${label})`)
          .setValue(value)
          .setDefault(value === currentLang),
      ),
    );

  return container.addActionRowComponents(
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
  );
}

export function HoyolabRewardSection(
  container: ContainerBuilder,
  reward: {
    icon: string;
    name: string;
    cnt: number;
  },
) {
  return TextDisplay(container, [`### ${reward.name} (x${reward.cnt})`], reward.icon);
}

export function HoyolabUserSection(container: ContainerBuilder, recordCard: GameRecordCard) {
  const card = recordCard;
  const logo = card.logo;

  return TextDisplay(
    container,
    [
      `> ${card.game_name} | Server: ${card.region_name}`,
      `### UID: ${card.game_role_id}`,
      `## ${card.nickname} (level ${card.level})`,
    ],
    logo,
  );
}

export function HoyolabProfilePrivateNotice(container: ContainerBuilder, withToggleButton = false) {
  return TextDisplay(container, [
    '-# *This profile is private. Only you can see it.*',
    withToggleButton
      ? new ButtonBuilder()
          .setCustomId('hoyolab-toggle-profile-visibility')
          .setLabel('Change Profile Visibility')
          .setStyle(ButtonStyle.Primary)
      : undefined,
  ]);
}

export function HoyolabTodayRewardSection(
  container: ContainerBuilder,
  currentDay: number,
  rewards: Parameters<typeof HoyolabRewardSection>[1][],
) {
  if (rewards.length === 0)
    return TextDisplay(container, [
      `> ## Today's Rewards (Day ${currentDay}):`,
      '## *No rewards for today or waiting for next month refresh.*',
    ]);

  if (rewards.length === 1) {
    const reward = rewards[0]!;
    return TextDisplay(
      container,
      [`> ## Today's Rewards (Day ${currentDay}):`, `### ${reward.name} (x${reward.cnt})`],
      reward.icon,
    );
  }

  TextDisplay(container, `> ## Today's Rewards (Day ${currentDay}):`);
  rewards.forEach((reward) => {
    HoyolabRewardSection(container, reward);
  });
  return container;
}

export function HoyolabTomorrowRewardSection(
  container: ContainerBuilder,
  rewards: Parameters<typeof HoyolabRewardSection>[1][],
) {
  if (rewards.length === 0)
    return TextDisplay(container, [
      "> ## Tomorrow's Rewards:",
      '## *No rewards for tomorrow or waiting for next month refresh.*',
    ]);

  if (rewards.length === 1) {
    const reward = rewards[0]!;
    return TextDisplay(
      container,
      [`> ## Tomorrow's Rewards:`, `### ${reward.name} (x${reward.cnt})`],
      reward.icon,
    );
  }

  TextDisplay(container, "> ## Tomorrow's Rewards:");
  rewards.forEach((reward) => {
    HoyolabRewardSection(container, reward);
  });
  return container;
}
