import CommandInteraction from '../../utilities/interaction/command.interaction.js';

export async function EndfieldHowToGetAccountToken(int: CommandInteraction) {
  await int.SendOrEdit(
    `You knew how to get it xd, now click/tap to ${int.client.mentionSlashCommand(
      'endfield set-account-token',
    )} and paste the token to save it.`,
  );
  return;
}
