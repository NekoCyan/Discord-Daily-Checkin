import { ButtonStyle, ContainerBuilder, MessageFlags, User } from 'discord.js';
import { ServiceError } from '../../errors/ServiceError.js';
import EndfieldModel from '../../models/Endfield.js';
import EndfieldService from '../../services/endfield.service.js';
import { definePage } from '../../utilities/interaction/_helper.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';
import ContextMenuInteraction from '../../utilities/interaction/contextmenu.interaction.js';
import { Separator, TextDisplay } from '../_helper.js';
import {
  EndfieldIngameBaseSection,
  EndfieldIngameRealTimeResourcesSection,
  EndfieldIngameUserSection,
  EndfieldProfilePrivateNotice,
  EndfieldRewardSection,
  EndfieldSkportUserSection,
} from './_helper.js';
import { EndfieldSetVisibility } from './SetVisibility.js';

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
        ? `You have not set your Endfield account token yet. Please use ${int.client.mentionSlashCommand('endfield set-account-token')} to set it.`
        : `${target.toString()} has not set their Endfield account token yet.`,
    );
  // Check if public.
  if (!endfieldModel.isPublic && !isSelf)
    return int.SendOrEdit(`${target.toString()} has set their profile to private.`);

  const service = new EndfieldService({
    accountToken: endfieldModel.accountToken,
    cred: endfieldModel.cred,
  });

  const err = await service.revalidateCredAndFetchUser().catch((e: ServiceError | Error) => e);
  let isError = false;
  // Check error details.
  if (err instanceof ServiceError) {
    // Check if it's unauthorized error, if so, reset the account token and cred in database, and ask user to set account token again.
    const isUnauthorized = await service.IsValidAccountToken();
    if (!isUnauthorized) {
      await endfieldModel.resetOnUnauthorized();

      // If not self, show the error to the command invoker, also notify the target user about the invalid token.
      const selfErrMsg = `Your Endfield account token is no more valid, as it will be removed from your Discord account. Please update it by using ${int.client.mentionSlashCommand('endfield set-account-token')}.`;
      let errMsg: string;
      if (isSelf) {
        errMsg = selfErrMsg;
      } else {
        errMsg = `Failed to fetch ${target.toString()}'s Endfield profile because their account token is no more valid.`;
        await target.send(selfErrMsg).catch(() => null);
      }

      return int.SendOrEdit(errMsg);
    }

    isError = true;
  } else if (err instanceof Error) {
    // Such as network error, etc.
    isError = true;
  }
  // If it's other error, just show the error message.
  if (isError) {
    logger.error({ err }, `Failed to fetch Endfield profile for user ${target.id} due to error:`);
    return int.SendOrEdit(
      [
        `Failed to fetch ${isSelf ? 'your' : `${target.toString()}'s`} Endfield profile, please try again later.`,
        `If the problem persists, please contact the bot administrator for more information.`,
      ].join('\n'),
    );
  }

  const [userSkport, userCheckin, userRealtimeDetail] = await Promise.all([
    service.getSkportUser(),
    service.getCheckInInfo(),
    service.getRealTimeDataDetail(),
  ]);

  // Skip await for database update.
  endfieldModel.updateOnChange(service.toObject());

  const isProfilePrivate = isSelf && !endfieldModel.isPublic;

  await int.PageController([
    definePage({
      label: 'Real-Time Info',
      style: ButtonStyle.Primary,
      fetch: async () => null,
      render: () => {
        const container = new ContainerBuilder();

        // Header.
        EndfieldIngameUserSection(container, userRealtimeDetail);
        // Separator.
        Separator(container);
        // In-game base user info section.
        TextDisplay(container, '> ### Base Info:');
        EndfieldIngameBaseSection(container, userRealtimeDetail);
        // Separator.
        Separator(container);
        // In-game statistics section.
        TextDisplay(container, '> ### Real-Time Resources:');
        EndfieldIngameRealTimeResourcesSection(container, userRealtimeDetail);

        // If the current profile is private, notice the user.
        if (isSelf && !endfieldModel.isPublic) {
          Separator(container);
          EndfieldProfilePrivateNotice(container);
        } else {
          Separator(container);
        }

        return {
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        };
      },
    }),
    definePage({
      label: 'Check-In Info',
      style: ButtonStyle.Primary,
      fetch: async () => null,
      render: () => {
        const container = new ContainerBuilder();

        // Header.
        EndfieldSkportUserSection(container, userSkport);
        // Separator.
        Separator(container);
        // Today's rewards.
        TextDisplay(container, `> ## Today's Rewards (Day ${userCheckin.currentDay}):`);
        userCheckin.todayRewards.forEach((reward) => {
          EndfieldRewardSection(container, reward);
        });
        // Separator.
        Separator(container);
        // Tomorrow's rewards.
        TextDisplay(container, "> ## Tomorrow's Rewards:");
        const tmrRewards = userCheckin.tomorrowRewards;
        if (tmrRewards.length > 0) {
          tmrRewards.forEach((reward) => {
            EndfieldRewardSection(container, reward);
          });
        } else {
          TextDisplay(container, '## *No rewards for tomorrow or waiting for next month refresh.*');
        }
        // Separator.
        Separator(container);
        // Footer.
        const nextCheckinTS = Math.floor(userCheckin.nextDayTimestamp / 1000);
        TextDisplay(
          container,
          [
            `Today check-in status: ${userCheckin.isTodayChecked ? '✅ Checked in' : '❌ Not checked in yet'}.`,
            `Next check-in time: <t:${nextCheckinTS}:R> (<t:${nextCheckinTS}:F>).`,
          ].join('\n'),
        );

        // If the current profile is private, notice the user.
        if (isSelf && !endfieldModel.isPublic) {
          Separator(container);
          EndfieldProfilePrivateNotice(container);
        } else {
          Separator(container);
        }

        return {
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        };
      },
    }),
    isProfilePrivate
      ? definePage({
          label: 'Public your Profile',
          style: ButtonStyle.Success,
          once: true,
          onceBehavior: 'remove',
          refreshRender: true,
          fetch: async () => {
            await EndfieldSetVisibility(int, 'public');

            // Virtual the public state to delete the notice.
            endfieldModel.isPublic = true;
            return null;
          },
        })
      : undefined,
  ]);

  return;
}
