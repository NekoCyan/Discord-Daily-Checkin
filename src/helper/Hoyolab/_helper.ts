import {
  ActionRowBuilder,
  ContainerBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import HoyolabService from '../../services/hoyolab.service.js';

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
