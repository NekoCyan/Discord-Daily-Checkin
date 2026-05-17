import {
  ContainerBuilder,
  InteractionReplyOptions,
  MessageFlags,
  StringSelectMenuInteraction,
  User,
} from 'discord.js';
import BotClient from '../../BotClient.js';
import HoyolabModel from '../../models/Hoyolab.js';
import HoyolabService, { HoyolabCheckInCache } from '../../services/hoyolab.service.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';
import SelectMenuInteraction from '../../utilities/interaction/selectmenu.interaction.js';
import { Separator, TextDisplay } from '../_helper.js';

/**
 * Handle the check-in process for Hoyolab, including token validation and database updates.
 * @param client The bot client instance.
 * @param user The Discord user performing the check-in.
 * @param int [optional] Interaction object from the command. If none provided, it should me automatically claim/do request checkin/daily.
 * @returns
 */
export async function HoyolabDoCheckIn(
  client: BotClient,
  user: User,
  int?: CommandInteraction | SelectMenuInteraction<StringSelectMenuInteraction>,
  cache?: HoyolabCheckInCache,
): Promise<unknown> {
  const model = await HoyolabModel.getOrCreate(user.id);

  const intReply = (msg: InteractionReplyOptions | string) => {
    if (int) {
      if (int instanceof CommandInteraction) return int.SendOrEdit(msg);
      else if (int instanceof SelectMenuInteraction) return int.followUp(msg, true);
      else return null;
    }
    return null;
  };

  if (int && !model.isAccountSetted())
    return intReply(
      `You have not set your Hoyolab account cookie. Please use ${client.mentionSlashCommand('hoyolab set-cookie')} or ${client.mentionSlashCommand('hoyolab set-cookie-2')} to set it.`,
    );

  const service = new HoyolabService({
    ltoken_v2: model.ltoken_v2,
    ltuid_v2: model.ltuid_v2,
    lang: model.lang,
  });
  const isValid = await service.isValidCookie();
  if (!isValid) {
    await model.resetOnUnauthorized();
    const errMsg = `The Hoyolab account cookie you provided is no more valid, as it will be removed from your Discord account. Please update it by using ${client.mentionSlashCommand('hoyolab set-cookie')} or ${client.mentionSlashCommand('hoyolab set-cookie-2')}.`;
    if (int) return intReply(errMsg);
    else user.send(errMsg).catch(() => null);
  }
  const isGameIdsSetted = model.isGameIdsSetted();
  if (!isGameIdsSetted) {
    const errMsg = `You have not set your game for daily check-in. Please use ${client.mentionSlashCommand('hoyolab setup-wizard')} to set it, so the bot knows which games you want to check in daily.`;
    if (int) return intReply(errMsg);
    else return;
  }

  const gamesInfo = service.getGamesInfoWithDailyCheck(model.gameIdsToDailyCheck, cache);

  // Promise to get attendance first.
  const attendancePromises = gamesInfo.map((game) => game.getAttendance());
  const attendanceResults = await Promise.all(attendancePromises);

  // Get info before check-in.
  const nextDayTS = Math.floor(attendanceResults[0]!.nextDayTimestamp / 1000);
  const nextCheckInTime = `Next check-in time: <t:${nextDayTS}:R> (<t:${nextDayTS}:F>).`;

  // If all games already checked in, then skip the check-in process and just update the database and announce the next check-in time.
  if (attendanceResults.every((res) => res.isTodayChecked)) {
    // Save once per instace if already checked in, and update the rest if needed.
    await model.markLastDailyAsToday(false);
    await model.updateOnChange(service.toObject(), { save: false });
    await model.save(); // Manual save to ensure all field (includes lastDailyChecked) are updated in database.

    if (int)
      return intReply(
        [
          'You have already checked in today.',
          `If you want to see what you received today, use ${client.mentionSlashCommand('hoyolab profile')}.`,
          nextCheckInTime,
        ].join('\n'),
      );
    else
      return user
        .send(
          [
            '## Hoyolab check-in Skipped.',
            'Looks like you have already checked in today so skipped the check-in process.',
            `If you want to see what you received today, use ${client.mentionSlashCommand('hoyolab profile')}.`,
            nextCheckInTime,
          ].join('\n'),
        )
        .catch(() => null);
  }

  const contentConstruction: { checkInDay: number; gameName: string; message: string }[] = [];
  // Filter out the games that already checked in, so only perform check-in for the games that have not checked in yet.
  const gamesToCheckIn = gamesInfo.filter((_, index) => !attendanceResults[index]!.isTodayChecked);
  const checkInPromises = gamesToCheckIn.map((game) => game.doCheckIn());
  const checkInResults = await Promise.all(
    checkInPromises.map((p) => p.catch((e: Error) => e.message)),
  );
  // Loop through the check-in results for message.
  for (let i = 0; i < checkInResults.length; i++) {
    const result = checkInResults[i];
    const gameInfo = gamesToCheckIn[i]!;
    const attendanceInfo = attendanceResults[model.gameIdsToDailyCheck.indexOf(gameInfo.id)]!;
    let errMsg = '';
    if (typeof result === 'string')
      errMsg = [
        `Failed to check-in (\`${result}\`).`,
        `-# Please try ${client.mentionSlashCommand('hoyolab check-in')} or manually check-in on [Official Website](<${gameInfo.checkInWebUrl}>).`,
      ].join('\n');

    contentConstruction.push({
      checkInDay: attendanceInfo.currentDay,
      gameName: gameInfo.name,
      message: errMsg || `Check-in was successful!`,
    });
  }

  // Immediately update the database to and announce the result.
  await model.markLastDailyAsToday(false);
  await model.updateOnChange(service.toObject(), { save: false });
  await model.save(); // Manual save to ensure all field (includes lastDailyChecked) are updated in database.

  // Render section.
  const container = new ContainerBuilder();

  // Header.
  TextDisplay(container, `## Hoyolab check-in result!`);
  // Separator.
  Separator(container);
  // Results.
  contentConstruction.forEach(({ checkInDay, gameName, message }) => {
    TextDisplay(container, `> ### ${gameName} (Day ${checkInDay})`);
    TextDisplay(container, message);
    Separator(container);
  });
  // Footer.
  TextDisplay(
    container,
    [
      `You can use ${client.mentionSlashCommand('hoyolab profile')} to see what you received today.`,
      nextCheckInTime,
    ].join('\n'),
  );

  if (int)
    return intReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  else
    return user
      .send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
}
