import mongoose from 'mongoose';
import EndfieldService from '../services/endfield.service.js';
import { timestampStartOfTheDay } from '../utilities/Utils.js';
import { extractSchemaKeys } from './_helper.js';
import {
  IEndfield,
  IEndfieldInstanceMethods,
  IEndfieldModel,
  IEndfieldStatics,
} from './interfaces/index.js';

const EndfieldSchema = new mongoose.Schema<
  IEndfield,
  IEndfieldModel,
  IEndfieldInstanceMethods,
  object,
  object,
  IEndfieldStatics
>(
  {
    discordId: { type: String, required: true, unique: true, index: true },
    accountToken: { type: String, default: '' },
    cred: { type: String, default: '' },
    isPublic: { type: Boolean, default: false },
    lastDailyChecked: { type: String, default: '', index: true },
  },
  {
    versionKey: false,
  },
);

// methods.
EndfieldSchema.methods = {
  async updateOnChange(data: Record<string, unknown>, save = true) {
    const self = this as unknown as Record<string, unknown>;
    const validKeys = extractSchemaKeys(EndfieldSchema);

    let hasChanges = false;

    for (const key of validKeys) {
      if (!(key in data)) continue;
      if (self[key] === data[key]) continue;

      self[key] = data[key];
      hasChanges = true;
    }

    if (hasChanges && save) await this.save();

    return hasChanges;
  },
  isDailyChecked() {
    const timeNow = EndfieldModel.getDailyDateToday();

    return this.lastDailyChecked === timeNow;
  },
  async markLastDailyAsToday(save = true) {
    if (this.isDailyChecked()) return;

    const timeNow = EndfieldModel.getDailyDateToday();

    this.lastDailyChecked = timeNow;
    if (save) await this.save();
  },
  async resetOnUnauthorized() {
    await this.updateOnChange({
      accountToken: '',
      cred: '',
      lastDailyChecked: '',
    });
  },
};

// statics.
EndfieldSchema.statics = {
  getDailyDateToday() {
    return timestampStartOfTheDay(EndfieldService.Constants.DAILY_RESET_TIMEZONE)!.format(
      'YYYY-MM-DD',
    );
  },
  getOrCreate(discordId) {
    return this.findOneAndUpdate(
      { discordId },
      { discordId },
      { upsert: true, returnDocument: 'after' },
    ).exec();
  },
};

// middlewares.
EndfieldSchema.pre<IEndfield>('save', async function () {});

const EndfieldModel =
  (mongoose.models.Endfield as IEndfieldModel) ||
  mongoose.model<IEndfield, IEndfieldModel>('Endfield', EndfieldSchema);

export default EndfieldModel;
