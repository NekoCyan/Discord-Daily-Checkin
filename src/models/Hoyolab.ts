import mongoose from 'mongoose';
import HoyolabService from '../services/hoyolab.service.js';
import { timestampStartOfTheDay } from '../utilities/Utils.js';
import { extractSchemaKeys } from './_helper.js';
import {
  IHoyolab,
  IHoyolabInstanceMethods,
  IHoyolabModel,
  IHoyolabStatics,
} from './interfaces/index.js';

const HoyolabSchema = new mongoose.Schema<
  IHoyolab,
  IHoyolabModel,
  IHoyolabInstanceMethods,
  object,
  object,
  IHoyolabStatics
>(
  {
    discordId: { type: String, required: true, unique: true, index: true },
    ltoken_v2: { type: String, default: '' },
    ltuid_v2: { type: String, default: '' },
    isPublic: { type: Boolean, default: false },
    lang: { type: String, default: 'en-us' },
    gameIdsToDailyCheck: { type: [Number], default: [] },
    lastDailyChecked: { type: String, default: '', index: true },
  },
  {
    versionKey: false,
  },
);

// methods.
HoyolabSchema.methods = {
  async updateOnChange(data: Record<string, unknown>, options) {
    const { save = true, force = false } = options || {};

    const self = this as unknown as Record<string, unknown>;
    const validKeys = extractSchemaKeys(HoyolabSchema);

    let hasChanges = false;

    for (const key of validKeys) {
      if (!(key in data)) continue;

      const current = self[key];
      const incoming = data[key];

      const isArray = Array.isArray(current) || Array.isArray(incoming);
      if (isArray) {
        const currentArr = Array.isArray(current) ? current : [];
        const incomingArr = Array.isArray(incoming) ? incoming : [];

        const isSame =
          currentArr.length === incomingArr.length &&
          currentArr.every((v, i) => v === incomingArr[i]);

        if (isSame) continue;
      } else {
        if (current === incoming) continue;
      }

      self[key] = incoming;
      hasChanges = true;
    }

    if (force || (hasChanges && save)) await this.save();

    return hasChanges;
  },
  isDailyChecked() {
    const timeNow = HoyolabModel.getDailyDateToday();

    return this.lastDailyChecked === timeNow;
  },
  async markLastDailyAsToday(save = true) {
    if (this.isDailyChecked()) return;

    const timeNow = HoyolabModel.getDailyDateToday();

    this.lastDailyChecked = timeNow;
    if (save) await this.save();
  },
  async resetOnUnauthorized() {
    await this.updateOnChange({
      ltoken_v2: '',
      ltuid_v2: '',
      lastDailyChecked: '',
      gameIdsToDailyCheck: [],
    });
  },
  isAccountSetted() {
    return Boolean(this.ltoken_v2 && this.ltuid_v2);
  },
};

// statics.
HoyolabSchema.statics = {
  getDailyDateToday() {
    return timestampStartOfTheDay(HoyolabService.Constants.DAILY_RESET_TIMEZONE)!.format(
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
  getBatchUncheckedDaily(size) {
    const timeNow = this.getDailyDateToday();

    return this.find({
      ltoken_v2: { $ne: '' },
      lastDailyChecked: { $ne: timeNow },
    })
      .limit(size)
      .exec();
  },
};

// middlewares.
HoyolabSchema.pre<IHoyolab>('save', async function () {});

const HoyolabModel =
  (mongoose.models.Hoyolab as IHoyolabModel) ||
  mongoose.model<IHoyolab, IHoyolabModel>('Hoyolab', HoyolabSchema);

export default HoyolabModel;
