import HoyolabModel from '../../models/Hoyolab.js';
import HoyolabService from '../../services/hoyolab.service.js';
import CommandInteraction from '../../utilities/interaction/command.interaction.js';
import { cookieParser } from '../../utilities/Utils.js';
import { HoyolabSetupWizard } from './SetupWizard.js';

export async function HoyolabSetCookie(int: CommandInteraction, cookie: string): Promise<unknown> {
  // Parse the cookie string into an object
  const cookieObj = cookieParser(cookie);

  const ltoken_v2 = cookieObj['ltoken_v2'];
  const ltuid_v2 = cookieObj['ltuid_v2'];

  // If either ltoken_v2 or ltuid_v2 is missing, the cookie is invalid
  if (!ltoken_v2 || !ltuid_v2) {
    return int.SendOrEdit(
      'The cookie you provided is invalid. Please make sure it includes both `ltoken_v2` and `ltuid_v2` values.',
    );
  }

  // Check if the token is valid before saving it
  const service = new HoyolabService({ ltoken_v2: ltoken_v2, ltuid_v2: ltuid_v2 });
  const isValid = await service.isValidCookie();
  if (!isValid)
    return int.SendOrEdit(
      'The Hoyolab cookie that you provided is invalid. Please double-check and try again.',
    );
  // Check if user has any game accounts linked to the Hoyolab account, if not, no need to save the cookie since it cannot be used for check-in.
  const gameAccounts = await service.getGameRecordCard();
  if (gameAccounts.list.length === 0) {
    return int.SendOrEdit(
      'The Hoyolab account linked to the cookie you provided does not have any game accounts linked to it. Please make sure you have linked at least one game account to your Hoyolab account before setting the cookie.',
    );
  }

  // Save the valid token to the database
  const model = await HoyolabModel.getOrCreate(int.interaction.user.id);

  // Complete reset related data since user want to change cookie.
  await model.resetOnUnauthorized();
  // Then update the cookie info.
  await model.updateOnChange(service.toObject(), { force: true });

  // Going to setup wizard after setting cookie, to let user choose their daily games and language preferences.
  return HoyolabSetupWizard(int, { model, service });
}
