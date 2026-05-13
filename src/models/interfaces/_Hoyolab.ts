import { Document, HydratedDocument, Model } from 'mongoose';
import { DocumentResult, WithThis } from './ExternalDocument.js';

export interface HoyolabData {
  discordId: string;
  /**
   * This token to do request to HoYoLAB API by using it as cookie.
   */
  ltoken_v2: string;
  /**
   * This uid is used to identify the user in HoYoLAB API, it is required to do request to HoYoLAB API by using it as cookie.
   */
  ltuid_v2: string;
  /**
   * Indicates whether the user's Hoyolab profile and related
   * information are publicly visible for discord users when
   * they view the profile of the user.
   */
  isPublic: boolean;
  /**
   * An array of game IDs for which the user wants to perform the daily check-in.
   * This field is used to track which games the user has checked in for on a
   * given day, allowing for game-specific rewards or notifications.
   */
  gameIdsToDailyCheck: number[];
  /**
   * A string in the format 'YYYY-MM-DD' representing the last
   * date the user performed a daily check-in.
   */
  lastDailyChecked: string;
}
export interface IHoyolab extends HoyolabData, DocumentResult<HoyolabData>, Document {}
export interface IHoyolabInstanceMethods {
  /**
   * Update the Hoyolab instance with the provided data, only if the new values are different from the current ones.
   * This method is useful for updating multiple fields at once while ensuring that only changed fields are updated.
   * @param data An object containing the fields to update with their new values.
   * @param options An optional object with the following properties:
   * - save [default=true]: Whether to save the changes to the database immediately after updating in memory.
   * - force [default=false]: If true, forces the update and save even if no changes are detected.
   * @returns A promise that resolves to a boolean indicating whether any changes were made.
   */
  updateOnChange: (
    data: Partial<Omit<HoyolabData, 'discordId'>>,
    options?: {
      save?: boolean;
      force?: boolean;
    },
  ) => Promise<boolean>;
  isDailyChecked: () => boolean;
  /**
   * Mark the last daily check-in date as today. This method updates the `lastDailyChecked` field to the current date in 'YYYY-MM-DD' format.
   * @param save [default=true] Whether to save the changes to the database immediately after updating in memory.
   * @returns A promise that resolves when the operation is complete.
   */
  markLastDailyAsToday: (save?: boolean) => Promise<void>;
  resetOnUnauthorized: () => Promise<void>;
}
export interface IHoyolabStaticsMethods {
  /**
   * Get today's date in 'YYYY-MM-DD' format based on the daily reset timezone defined in {HoyolabService.Constants.DAILY_RESET_TIMEZONE}.
   * @returns A string representing today's date in 'YYYY-MM-DD' format.
   */
  getDailyDateToday(): string;
  getOrCreate(discordId: string): Promise<HoyolabHydratedDocument>;
  /**
   * Get a batch of Hoyolab documents that have not performed their daily check-in today.
   * This method is useful for processing daily rewards or notifications for users who haven't checked in yet.
   * The method retrieves a specified number of documents where the `lastDailyChecked` field does not match today's date.
   * @param size The number of documents to retrieve in the batch.
   * @returns A promise that resolves to an array of Hoyolab documents that have not checked in today.
   */
  getBatchUncheckedDaily(size: number): Promise<HoyolabHydratedDocument[]>;
}
export type IHoyolabStatics = WithThis<IHoyolabModel, IHoyolabStaticsMethods>;
export interface IHoyolabModel
  extends Model<IHoyolab, object, IHoyolabInstanceMethods>, IHoyolabStatics {}
export type HoyolabHydratedDocument = HydratedDocument<IHoyolab, IHoyolabInstanceMethods>;
