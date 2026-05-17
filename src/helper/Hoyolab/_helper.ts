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
  return TextDisplay(container, [`### ${reward.name}`, `x${reward.cnt}`], reward.icon);
}

export function HoyolabUserSection(container: ContainerBuilder, recordCard: GameRecordCard) {
  const card = recordCard;
  const logo = card.logo;

  return TextDisplay(
    container,
    [
      `> ### ${card.game_name}`,
      `### UID: ${card.game_role_id}`,
      `## ${card.nickname} (level ${card.level})`,
      `Server: ${card.region_name}`,
    ].join('\n'),
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
