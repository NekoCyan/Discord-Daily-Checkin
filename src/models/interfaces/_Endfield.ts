import { Document, HydratedDocument, Model } from 'mongoose';
import { DocumentResult, WithThis } from './ExternalDocument.js';

export interface EndfieldData {
  discordId: string;
  /**
   * This token is used for getting CRED via OAuth2.
   */
  accountToken: string;
  /**
   * This is the CRED obtained from using the accountToken,
   * it's like a session token with limited validity.
   */
  cred: string;
  /**
   * Indicates whether the user's Endfield profile and related
   * information are publicly visible for discord users when
   * they view the profile of the user.
   */
  isPublic: boolean;
  /**
   * A string in the format 'YYYY-MM-DD' representing the last
   * date the user performed a daily check-in.
   */
  lastDailyChecked: string;
}
export interface IEndfield extends EndfieldData, DocumentResult<EndfieldData>, Document {}
export interface IEndfieldInstanceMethods {
  /**
   * Update the Endfield instance with the provided data, only if the new values are different from the current ones.
   * This method is useful for updating multiple fields at once while ensuring that only changed fields are updated.
   * @param data An object containing the fields to update with their new values.
   * @param save [default=false] Whether to save the changes to the database immediately after updating in memory.
   * @returns A promise that resolves to a boolean indicating whether any changes were made.
   */
  updateOnChange: (
    data: Partial<Omit<EndfieldData, 'discordId'>>,
    save?: boolean,
  ) => Promise<boolean>;
  isDailyChecked: () => boolean;
  /**
   * Mark the last daily check-in date as today. This method updates the `lastDailyChecked` field to the current date in 'YYYY-MM-DD' format.
   * @param save [default=true] Whether to save the changes to the database immediately after updating in memory.
   * @returns A promise that resolves when the operation is complete.
   */
  markLastDailyAsToday: (save?: boolean) => Promise<void>;
}
export interface IEndfieldStaticsMethods {
  getOrCreate(discordId: string): Promise<EndfieldHydratedDocument>;
}
export type IEndfieldStatics = WithThis<IEndfieldModel, IEndfieldStaticsMethods>;
export interface IEndfieldModel
  extends Model<IEndfield, object, IEndfieldInstanceMethods>, IEndfieldStatics {}
export type EndfieldHydratedDocument = HydratedDocument<IEndfield, IEndfieldInstanceMethods>;
