import { ButtonBuilder, ButtonStyle, ContainerBuilder } from 'discord.js';
import EndfieldService from '../../services/endfield.service.js';
import { TextDisplay } from '../_helper.js';

export function EndfieldSkportUserSection(
  container: ContainerBuilder,
  userInfo: Awaited<ReturnType<EndfieldService['getSkportUser']>>,
) {
  const skportUser = userInfo.user.basicUser;
  const avatar = skportUser.avatar;

  return TextDisplay(
    container,
    [`### Skport UID: ${skportUser.id}`, `## ${skportUser.nickname}`],
    avatar,
  );
}

export function EndfieldIngameUserSection(
  container: ContainerBuilder,
  userInfo: Awaited<ReturnType<EndfieldService['getRealTimeDataDetail']>>,
) {
  const ingameUser = userInfo.detail.base;
  const avatar = ingameUser.avatarUrl;

  return TextDisplay(
    container,
    [
      `### UID: ${ingameUser.roleId}`,
      `## ${ingameUser.name} (level ${ingameUser.level})`,
      `Server: ${ingameUser.serverName}`,
    ],
    avatar,
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
  return TextDisplay(
    container,
    [`### ${reward.name} (x${reward.count})`, `-# ${reward.id}`],
    reward.icon,
  );
}

export function EndfieldProfilePrivateNotice(
  container: ContainerBuilder,
  withToggleButton = false,
) {
  return TextDisplay(container, [
    '-# *This profile is private. Only you can see it.*',
    withToggleButton
      ? new ButtonBuilder()
          .setCustomId('endfield-toggle-profile-visibility')
          .setLabel('Change Profile Visibility')
          .setStyle(ButtonStyle.Primary)
      : undefined,
  ]);
}

export function EndfieldIngameBaseSection(
  container: ContainerBuilder,
  userInfo: Awaited<ReturnType<EndfieldService['getRealTimeDataDetail']>>,
) {
  const detailUser = userInfo.detail;
  const ingameUser = detailUser.base;

  return TextDisplay(
    container,
    [
      `**Awaken Date**: **<t:${ingameUser.createTime}:D>**`,
      `**World Level**: \`${ingameUser.worldLevel}\``,
      `**Operators/Weapons/Files**: \`${ingameUser.charNum}\`/\`${ingameUser.weaponNum}\`/\`${ingameUser.docNum}\``,
      `**Achievements**: \`${detailUser.achieve.count}\``,
    ].join('\n'),
  );
}

export function EndfieldIngameRealTimeResourcesSection(
  container: ContainerBuilder,
  userInfo: Awaited<ReturnType<EndfieldService['getRealTimeDataDetail']>>,
) {
  const detailUser = userInfo.detail;

  const isSanityFullyReplenished =
    Number(detailUser.dungeon.maxTs) - Math.floor(Date.now() / 1000) <= 0;
  const sanityReplishmentText = isSanityFullyReplenished ? '(Fully Replenished)' : '';
  const currentStamina = isSanityFullyReplenished
    ? detailUser.dungeon.maxStamina
    : detailUser.dungeon.curStamina;
  const maxSanity = detailUser.dungeon.maxStamina;

  return TextDisplay(
    container,
    [
      `**Daily mission (point)**: \`${detailUser.dailyMission.dailyActivation}\`/**${detailUser.dailyMission.maxDailyActivation}**`,
      `**Sanity**: \`${currentStamina}\`/**${maxSanity}** ${sanityReplishmentText}`,
      !isSanityFullyReplenished
        ? `-# Sanity fully replenishment estimate: <t:${detailUser.dungeon.maxTs}:R> (<t:${detailUser.dungeon.maxTs}:F>)`
        : undefined,
      `**Weekly mission (point)**: \`${detailUser.weeklyMission.score}\`/**${detailUser.weeklyMission.total}**`,
      `**BattlePass (level)**: \`${detailUser.bpSystem.curLevel}\`/**${detailUser.bpSystem.maxLevel}**`,
    ]
      .filter(Boolean)
      .map((x) => (x as string).trim())
      .join('\n'),
  );
}
