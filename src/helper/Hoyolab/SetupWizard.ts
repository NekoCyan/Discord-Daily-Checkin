import { ContainerBuilder, MessageFlags } from 'discord.js';
import HoyolabModel from '../../models/Hoyolab.js';
import HoyolabService from '../../services/hoyolab.service.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';
import { Separator, TextDisplay } from '../_helper.js';
import { HoyolabGameSelectMenu, HoyolabLangSelectMenu } from './_helper.js';

export async function HoyolabSetupWizard(
  int: CommandInteraction,
  cache?: {
    model: Awaited<ReturnType<typeof HoyolabModel.getOrCreate>>;
    service: HoyolabService;
  },
): Promise<unknown> {
  const model = cache?.model ?? (await HoyolabModel.getOrCreate(int.interaction.user.id));

  // If the user doesn't have a valid cookie, prompt them to set it first.
  if (!model || !model.isAccountSetted())
    return int.SendOrEdit(
      `It looks like you haven't set up your Hoyolab account cookie yet. Please use the ${int.client.mentionSlashCommand('hoyolab set-cookie')} command to link your account before using the setup wizard.`,
    );

  const ltoken_v2 = model.ltoken_v2;
  const ltuid_v2 = model.ltuid_v2;
  const lang = model.lang;

  const service = cache?.service ?? new HoyolabService({ ltoken_v2, ltuid_v2, lang });

  // Fetch linked game accounts.
  const gameRecordCard = await service.getGameRecordCard();
  const games = gameRecordCard.list;

  if (games.length === 0)
    return int.SendOrEdit(
      `No linked game accounts were found on your Hoyolab profile. Please link a game account on Hoyolab first, then try again with ${int.client.mentionSlashCommand('hoyolab setup-wizard')}.`,
    );

  const container = new ContainerBuilder();

  // Header.
  TextDisplay(container, '> ## Hoyolab Setup Wizard');
  Separator(container);

  // Game select menu.
  TextDisplay(container, '### Select games for daily check-in (and show in Profile):');
  HoyolabGameSelectMenu(container, games, model.gameIdsToDailyCheck);
  Separator(container);

  // Language select menu.

  TextDisplay(container, '### Select your preferred language:');
  HoyolabLangSelectMenu(container, lang);

  return int.SendOrEdit({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  });
}
