import { ButtonStyle, ContainerBuilder, MessageFlags, User } from 'discord.js';
import HoyolabModel from '../../models/Hoyolab.js';
import HoyolabService from '../../services/hoyolab.service.js';
import { definePage } from '../../utilities/interaction/_helper.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';
import ContextMenuInteraction from '../../utilities/interaction/contextmenu.interaction.js';
import { Separator, TextDisplay } from '../_helper.js';
import { HoyolabSetVisibility } from './SetVisibility.js';
import {
  HoyolabProfilePrivateNotice,
  HoyolabTodayRewardSection,
  HoyolabTomorrowRewardSection,
  HoyolabUserSection,
} from './_helper.js';

export async function HoyolabProfile(
  int: CommandInteraction | ContextMenuInteraction,
  target: User,
): Promise<unknown> {
  if (await int.PreventCommandOnBot(target)) return;
  const isSelf = target.id === int.interaction.user.id;

  const model = await HoyolabModel.getOrCreate(target.id);

  // Check if account token is set.
  if (int && !model.isAccountSetted())
    return int.SendOrEdit(
      isSelf
        ? `You have not set your Hoyolab account cookie. Please use ${int.client.mentionSlashCommand('hoyolab set-cookie')} or ${int.client.mentionSlashCommand('hoyolab set-cookie-2')} to set it.`
        : `${target.toString()} has not set their Hoyolab account cookie.`,
    );
  // Check if public.
  if (!model.isPublic && !isSelf)
    return int.SendOrEdit(`${target.toString()} has set their profile to private.`);

  const service = new HoyolabService({
    ltoken_v2: model.ltoken_v2,
    ltuid_v2: model.ltuid_v2,
    lang: model.lang,
  });
  const isValid = await service.isValidCookie().catch((e: Error) => e);
  if (isValid instanceof Error) {
    logger.error(
      { err: isValid },
      `Failed to validate Hoyolab cookie for ${target.id} due to error:`,
    );
    return int.SendOrEdit(
      [
        `Failed to fetch ${isSelf ? 'your' : `${target.toString()}'s`} Hoyolab profile, please try again later.`,
        `If the problem persists, please contact the bot administrator for more information.`,
      ].join('\n'),
    );
  } else if (isValid === false) {
    await model.resetOnUnauthorized();

    // If not self, show the error to the command invoker, also notify the target user about the invalid cookie.
    const selfErrMsg = `The Hoyolab account cookie you provided is no more valid, as it will be removed from your Discord account. Please update it by using ${int.client.mentionSlashCommand('hoyolab set-cookie')} or ${int.client.mentionSlashCommand('hoyolab set-cookie-2')}.`;
    let errMsg: string;
    if (isSelf) {
      errMsg = selfErrMsg;
    } else {
      errMsg = `Failed to fetch ${target.toString()}'s Hoyolab profile because their account cookie is no more valid.`;
      await target.send(selfErrMsg).catch(() => null);
    }

    return int.SendOrEdit(errMsg);
  }
  const isGameIdsSetted = model.isGameIdsSetted();
  if (!isGameIdsSetted) {
    const errMsg = [
      `${isSelf ? 'You have' : `${target.toString()} has`} not set ${isSelf ? 'your' : 'their'} game for daily check-in, so the bot doesn't know which games to show.`,
      !isSelf
        ? ''
        : `Please update it by using ${int.client.mentionSlashCommand('hoyolab setup-wizard')}.`,
    ]
      .filter(Boolean)
      .join('\n');

    return int.SendOrEdit(errMsg);
  }

  // Fetch calendar for cache so no need to refetch when come to page.
  const gamesCalendar = await HoyolabService.getAllGamesCalendar(service.lang);
  const calendarMapped = Object.fromEntries(
    Object.entries(gamesCalendar).map(([gameAbbr, calendar]) => [gameAbbr, calendar]),
  );

  const isProfilePrivate = isSelf && !model.isPublic;

  await int.PageController([
    ...service.getGamesInfoWithDailyCheck(model.gameIdsToDailyCheck).map((info) => {
      return definePage({
        label: `${info.abbr} Check-In Info`,
        style: ButtonStyle.Primary,
        fetch: async () => {
          const allRecordCard = await service.getGameRecordCard();
          const recordCard = allRecordCard.list.find((card) => card.game_id === info.id)!;

          return {
            recordCard,
            attendance: await info.getAttendance(calendarMapped),
          };
        },
        render: ({ recordCard, attendance }) => {
          const container = new ContainerBuilder();

          // Header
          HoyolabUserSection(container, recordCard);
          // Separator.
          Separator(container);
          // Today's rewards.
          HoyolabTodayRewardSection(container, attendance.currentDay, attendance.todayRewards);
          // Separator.
          Separator(container);
          // Tomorrow's rewards.
          HoyolabTomorrowRewardSection(container, attendance.tomorrowRewards);
          // Separator.
          Separator(container);
          // Footer.
          const nextCheckinTS = Math.floor(attendance.nextDayTimestamp / 1000);
          TextDisplay(
            container,
            [
              `Today check-in status: ${attendance.isTodayChecked ? '✅ Checked in' : '❌ Not checked in yet'}.`,
              `Next check-in time: <t:${nextCheckinTS}:R> (<t:${nextCheckinTS}:F>).`,
            ].join('\n'),
          );

          // If the current profile is private, notice the user.
          if (isSelf && !model.isPublic) {
            Separator(container);
            HoyolabProfilePrivateNotice(container);
          } else {
            Separator(container);
          }

          return {
            components: [container],
            flags: MessageFlags.IsComponentsV2,
          };
        },
      });
    }),
    isProfilePrivate
      ? definePage({
          label: 'Public your Profile',
          style: ButtonStyle.Success,
          once: true,
          onceBehavior: 'remove',
          refreshRender: true,
          fetch: async () => {
            await HoyolabSetVisibility(int, 'public');

            // Virtual the public state to delete the notice.
            model.isPublic = true;
            return null;
          },
        })
      : undefined,
  ]);

  return;
}
