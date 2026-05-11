import { ServiceError } from '../errors/ServiceError.js';
import { _DefaultHeaders } from '../utilities/Constants.js';
import { newAxiosInstance } from '../utilities/Request.js';
import BaseService from './baseService.js';

export interface HoyolabServiceOptions {
  ltoken_v2: string;
  ltuid_v2: string;
  lang?: string;
}

/**
 * @link https://github.com/sglkc/hoyolab-auto-daily/blob/master/index.js
 */
class HoyolabService extends BaseService {
  #ltoken_v2: string;
  #ltuid_v2: string;
  lang: string = 'en-us';

  /**
   * Cache for game record card data after fetched by using `getGameRecordCard` method.
   */
  gameRecordCard: GameRecordCardList | null = null;

  constructor(options: HoyolabServiceOptions) {
    super();

    this.#ltoken_v2 = options.ltoken_v2;
    this.#ltuid_v2 = options.ltuid_v2;
    this.lang = options.lang ?? this.lang;
  }

  static get Constants() {
    return {
      /**
       * Supported languages for Hoyolab services.
       * @see https://bbs-api-os.hoyolab.com/community/misc/wapi/langs?lang2022=true
       */
      LANGS: [
        {
          name: '简体中文',
          value: 'zh-cn',
          label: '简',
          alias: ['zh-cn', 'CHS'],
        },
        {
          name: '繁體中文',
          value: 'zh-tw',
          label: '繁',
          alias: ['zh-tw', 'CHT'],
        },
        {
          name: 'Deutsch',
          value: 'de-de',
          label: 'DE',
          alias: ['de-de', 'DE'],
        },
        {
          name: 'English',
          value: 'en-us',
          label: 'EN',
          alias: ['en-us', 'EN'],
        },
        {
          name: 'Español',
          value: 'es-es',
          label: 'ES',
          alias: ['es-es', 'ES'],
        },
        {
          name: 'Français',
          value: 'fr-fr',
          label: 'FR',
          alias: ['fr-fr', 'FR'],
        },
        {
          name: 'Indonesia',
          value: 'id-id',
          label: 'ID',
          alias: ['id-id', 'ID'],
        },
        {
          name: 'Italiano',
          value: 'it-it',
          label: 'IT',
          alias: ['it-it', 'IT'],
        },
        {
          name: '日本語',
          value: 'ja-jp',
          label: 'JP',
          alias: ['ja-jp', 'JP', 'JA'],
        },
        {
          name: '한국어',
          value: 'ko-kr',
          label: 'KR',
          alias: ['ko-kr', 'KR', 'KO'],
        },
        {
          name: 'Português',
          value: 'pt-pt',
          label: 'PT',
          alias: ['pt-pt', 'PT'],
        },
        {
          name: 'Pусский',
          value: 'ru-ru',
          label: 'RU',
          alias: ['ru-ru', 'RU'],
        },
        {
          name: 'ภาษาไทย',
          value: 'th-th',
          label: 'TH',
          alias: ['th-th', 'TH'],
        },
        {
          name: 'Türkçe',
          value: 'tr-tr',
          label: 'TR',
          alias: ['tr-tr', 'TR'],
        },
        {
          name: 'Tiếng Việt',
          value: 'vi-vn',
          label: 'VN',
          alias: ['vi-vn', 'VN', 'VI'],
        },
      ],
      gameIdToGameName: {
        1: 'Honkai Impact 3rd',
        2: 'Genshin Impact',
        6: 'Honkai: Star Rail',
        8: 'Zenless Zone Zero',
      },
      ActId: {
        ZZZ: 'e202406031448091',
        HSR: 'e202303301540311',
        GI: 'e202102251931481',
        HI3: 'e202110291205111',
      },
      URLS: {
        ZZZ: 'https://sg-public-api.hoyolab.com/event/luna/zzz/os',
        HSR: 'https://sg-public-api.hoyolab.com/event/luna/hkrpg/os',
        GI: 'https://sg-hk4e-api.hoyolab.com/event/sol',
        HI3: 'https://sg-public-api.hoyolab.com/event/mani',
        gameRecordCard:
          'https://sg-public-api.hoyolab.com/event/game_record/app/card/wapi/getGameRecordCard',
      },
      DAILY_RESET_TIMEZONE: 'Asia/Hong_Kong',
    };
  }

  get Constants() {
    return HoyolabService.Constants;
  }

  get defaultHeaders() {
    return {
      ..._DefaultHeaders,
      'content-type': 'application/json',
      origin: 'https://act.hoyolab.com',
      referer: 'https://act.hoyolab.com/',
      cookie: `ltoken_v2=${this.#ltoken_v2}; ltuid_v2=${this.#ltuid_v2}`,
    };
  }

  get ZZZHeaders() {
    return {
      ...this.defaultHeaders,
      'x-rpc-signgame': 'zzz',
    };
  }
  get HSRHeaders() {
    return {
      ...this.defaultHeaders,
      'x-rpc-signgame': 'hkrpg',
    };
  }
  get GIHeaders() {
    return {
      ...this.defaultHeaders,
    };
  }
  get HI3Headers() {
    return {
      ...this.defaultHeaders,
    };
  }

  static handleRetcodeOnResponse(res: HoyolabResponse<unknown>) {
    if (res.retcode === 0) return;

    throw this.error(`Hoyolab API Error: ${res.message}`, {
      ...res,
    });
  }
  handleRetcodeOnResponse(res: HoyolabResponse<unknown>) {
    return HoyolabService.handleRetcodeOnResponse(res);
  }

  /**
   * Validates the account token by making a request to fetch the game record card. If the token is valid, it will return true. If the token is invalid, it will return false. If there is any other error during the request, it will throw an error.
   * @returns A promise that resolves to true if the account token is valid, false if the account token is invalid, or throws an error if there is an unexpected error during the validation process.
   */
  async isValidAccount() {
    const res = await this.getGameRecordCard(true).catch((e: ServiceError | Error) => e);

    /**
      * Authorized (200)
      {
        "retcode": 0,
        "message": "OK",
        "data": T
      }

      * Unauthorized (200)
      {
        "data": null,
        "message": "Please login",
        "retcode": 10001
      }
     */
    if (res instanceof ServiceError) {
      if (res.data?.retcode === 10001) return false;

      throw this.error('Failed to validate account token with Hoyolab API.', res);
    } else if (res instanceof Error) {
      throw this.error(
        'Failed to validate account token with Hoyolab API due to unexpected error.',
        res,
      );
    } else {
      return true;
    }
  }

  // #region Calendar APIs - Used to get the calendar of rewards, check-in status for each day, etc. Not required for check-in, but can be used for displaying check-in calendar in the bot.
  /**
   * Fetches the calendar data for Zenless Zone Zero to display the check-in rewards.
   * @param lang The language code for the calendar data (e.g., 'en-us', 'zh-cn'). This will determine the language of the reward names and descriptions in the calendar.
   * @returns A promise that resolves to the calendar data.
   */
  static async ZZZCalendar(lang: string) {
    const res = await newAxiosInstance().get<ZZZCalendarResponse>(
      this.Constants.URLS.ZZZ + '/home',
      {
        params: {
          lang,
          act_id: this.Constants.ActId.ZZZ,
        },
        headers: {
          'x-rpc-signgame': 'zzz',
        },
      },
    );
    const axiosData = res.data;
    if (res.status !== 200) throw this.error(`Failed to fetch ZZZ Calendar.`, axiosData);
    this.handleRetcodeOnResponse(axiosData);
    return axiosData;
  }
  /**
   * Fetches the calendar data for Honkai: Star Rail to display the check-in rewards.
   * @param lang The language code for the calendar data (e.g., 'en-us', 'zh-cn'). This will determine the language of the reward names and descriptions in the calendar.
   * @returns A promise that resolves to the calendar data.
   */
  static async HSRCalendar(lang: string) {
    const res = await newAxiosInstance().get<HSRCalendarResponse>(
      this.Constants.URLS.HSR + '/home',
      {
        params: {
          lang,
          act_id: this.Constants.ActId.HSR,
        },
        headers: {
          'x-rpc-signgame': 'hkrpg',
        },
      },
    );
    const axiosData = res.data;
    if (res.status !== 200) throw this.error(`Failed to fetch HSR Calendar.`, axiosData);
    this.handleRetcodeOnResponse(axiosData);
    return axiosData;
  }
  /**
   * Fetches the calendar data for Genshin Impact to display the check-in rewards.
   * @param lang The language code for the calendar data (e.g., 'en-us', 'zh-cn'). This will determine the language of the reward names and descriptions in the calendar.
   * @returns A promise that resolves to the calendar data.
   */
  static async GICalendar(lang: string) {
    const res = await newAxiosInstance().get<GICalendarResponse>(this.Constants.URLS.GI + '/home', {
      params: {
        lang,
        act_id: this.Constants.ActId.GI,
      },
      headers: {},
    });
    const axiosData = res.data;
    if (res.status !== 200) throw this.error(`Failed to fetch GI Calendar.`, axiosData);
    this.handleRetcodeOnResponse(axiosData);
    return axiosData;
  }
  /**
   * Fetches the calendar data for Honkai Impact 3rd to display the check-in rewards.
   * @param lang The language code for the calendar data (e.g., 'en-us', 'zh-cn'). This will determine the language of the reward names and descriptions in the calendar.
   * @returns A promise that resolves to the calendar data.
   */
  static async HI3Calendar(lang: string) {
    const res = await newAxiosInstance().get<HI3CalendarResponse>(
      this.Constants.URLS.HI3 + '/home',
      {
        params: {
          lang,
          act_id: this.Constants.ActId.HI3,
        },
        headers: {},
      },
    );
    const axiosData = res.data;
    if (res.status !== 200) throw this.error(`Failed to fetch HI3 Calendar.`, axiosData);
    this.handleRetcodeOnResponse(axiosData);
    return axiosData;
  }
  // #endregion

  // #region Info APIs - Used to get general information about if user is checkd-in, current sign-in day, etc.
  /**
   * Fetches the check-in information for Zenless Zone Zero, including current sign-in status, total sign-in days, and other related info.
   * @returns A promise that resolves to the check-in information.
   */
  async ZZZInfo() {
    if (!this.#ltoken_v2) throw this.error('ltoken_v2 is required to perform this action.');
    if (!this.#ltuid_v2) throw this.error('ltuid_v2 is required to perform this action.');

    const res = await newAxiosInstance().get<ZZZInfoResponse>(this.Constants.URLS.ZZZ + '/info', {
      params: {
        lang: this.lang,
        act_id: this.Constants.ActId.ZZZ,
      },
      headers: this.ZZZHeaders,
    });
    const axiosData = res.data;
    if (res.status !== 200) throw this.error(`Failed to fetch ZZZ Info.`, axiosData);
    this.handleRetcodeOnResponse(axiosData);
    return axiosData;
  }
  /**
   * Fetches the check-in information for Honkai: Star Rail, including current sign-in status, total sign-in days, and other related info.
   * @returns A promise that resolves to the check-in information.
   */
  async HSRInfo() {
    if (!this.#ltoken_v2) throw this.error('ltoken_v2 is required to perform this action.');
    if (!this.#ltuid_v2) throw this.error('ltuid_v2 is required to perform this action.');

    const res = await newAxiosInstance().get<HSRInfoResponse>(this.Constants.URLS.HSR + '/info', {
      params: {
        lang: this.lang,
        act_id: this.Constants.ActId.HSR,
      },
      headers: this.HSRHeaders,
    });
    const axiosData = res.data;
    if (res.status !== 200) throw this.error(`Failed to fetch HSR Info.`, axiosData);
    this.handleRetcodeOnResponse(axiosData);
    return axiosData;
  }
  /**
   * Fetches the check-in information for Genshin Impact, including current sign-in status, total sign-in days, and other related info.
   * @returns A promise that resolves to the check-in information.
   */
  async GIInfo() {
    if (!this.#ltoken_v2) throw this.error('ltoken_v2 is required to perform this action.');
    if (!this.#ltuid_v2) throw this.error('ltuid_v2 is required to perform this action.');

    const res = await newAxiosInstance().get<GIInfoResponse>(this.Constants.URLS.GI + '/info', {
      params: {
        lang: this.lang,
        act_id: this.Constants.ActId.GI,
      },
      headers: this.GIHeaders,
    });
    const axiosData = res.data;
    if (res.status !== 200) throw this.error(`Failed to fetch GI Info.`, axiosData);
    this.handleRetcodeOnResponse(axiosData);
    return axiosData;
  }
  /**
   * Fetches the check-in information for Honkai Impact 3rd, including current sign-in status, total sign-in days, and other related info.
   * @returns A promise that resolves to the check-in information.
   */
  async HI3Info() {
    if (!this.#ltoken_v2) throw this.error('ltoken_v2 is required to perform this action.');
    if (!this.#ltuid_v2) throw this.error('ltuid_v2 is required to perform this action.');

    const res = await newAxiosInstance().get<HI3InfoResponse>(this.Constants.URLS.HI3 + '/info', {
      params: {
        lang: this.lang,
        act_id: this.Constants.ActId.HI3,
      },
      headers: this.HI3Headers,
    });
    const axiosData = res.data;
    if (res.status !== 200) throw this.error(`Failed to fetch HI3 Info.`, axiosData);
    this.handleRetcodeOnResponse(axiosData);
    return axiosData;
  }
  // #endregion

  // #region Check-In APIs - Used to perform the daily check-in action.
  /**
   * Performs the daily check-in for Zenless Zone Zero.
   * @returns A promise that resolves to the result of the check-in action.
   */
  async ZZZDoCheckIn() {
    if (!this.#ltoken_v2) throw this.error('ltoken_v2 is required to perform this action.');
    if (!this.#ltuid_v2) throw this.error('ltuid_v2 is required to perform this action.');

    const res = await newAxiosInstance().post<ZZZCheckInResponse>(
      this.Constants.URLS.ZZZ + '/sign',
      {
        act_id: this.Constants.ActId.ZZZ,
        lang: this.lang,
      },
      {
        headers: this.ZZZHeaders,
      },
    );
    const axiosData = res.data;
    if (res.status !== 200) throw this.error(`Failed to perform ZZZ Check-In.`, axiosData);
    this.handleRetcodeOnResponse(axiosData);
    return axiosData;
  }
  /**
   * Performs the daily check-in for Honkai: Star Rail.
   * @returns A promise that resolves to the result of the check-in action.
   */
  async HSRDoCheckIn() {
    if (!this.#ltoken_v2) throw this.error('ltoken_v2 is required to perform this action.');
    if (!this.#ltuid_v2) throw this.error('ltuid_v2 is required to perform this action.');

    const res = await newAxiosInstance().post<HSRCheckInResponse>(
      this.Constants.URLS.HSR + '/sign',
      {
        act_id: this.Constants.ActId.HSR,
        lang: this.lang,
      },
      {
        headers: this.HSRHeaders,
      },
    );
    const axiosData = res.data;
    if (res.status !== 200) throw this.error(`Failed to perform HSR Check-In.`, axiosData);
    this.handleRetcodeOnResponse(axiosData);
    return axiosData;
  }
  /**
   * Performs the daily check-in for Genshin Impact.
   * @returns A promise that resolves to the result of the check-in action.
   */
  async GIDoCheckIn() {
    if (!this.#ltoken_v2) throw this.error('ltoken_v2 is required to perform this action.');
    if (!this.#ltuid_v2) throw this.error('ltuid_v2 is required to perform this action.');

    const res = await newAxiosInstance().post<GICheckInResponse>(
      this.Constants.URLS.GI + '/sign',
      {
        act_id: this.Constants.ActId.GI,
      },
      {
        params: {
          lang: this.lang,
        },
        headers: this.GIHeaders,
      },
    );
    const axiosData = res.data;
    if (res.status !== 200) throw this.error(`Failed to perform GI Check-In.`, axiosData);
    this.handleRetcodeOnResponse(axiosData);
    return axiosData;
  }
  /**
   * Performs the daily check-in for Honkai Impact 3rd.
   * @returns A promise that resolves to the result of the check-in action.
   */
  async HI3DoCheckIn() {
    if (!this.#ltoken_v2) throw this.error('ltoken_v2 is required to perform this action.');
    if (!this.#ltuid_v2) throw this.error('ltuid_v2 is required to perform this action.');

    const res = await newAxiosInstance().post<HI3CheckInResponse>(
      this.Constants.URLS.HI3 + '/sign',
      {
        act_id: this.Constants.ActId.HI3,
      },
      {
        params: {
          lang: this.lang,
        },
        headers: this.HI3Headers,
      },
    );
    const axiosData = res.data;
    if (res.status !== 200) throw this.error(`Failed to perform HI3 Check-In.`, axiosData);
    this.handleRetcodeOnResponse(axiosData);
    return axiosData;
  }
  // #endregion

  /**
   * Fetches the game record card information for the account, which may include linked game accounts, their levels, regions, and other related info.
   * @param refetch Whether to force refetch the data from the API even if it's already cached. Default is `false`, which means it will return the cached data if available.
   * @returns A promise that resolves to the game record card information.
   */
  async getGameRecordCard(refetch = false) {
    if (!this.#ltoken_v2) throw this.error('ltoken_v2 is required to perform this action.');
    if (!this.#ltuid_v2) throw this.error('ltuid_v2 is required to perform this action.');

    if (this.gameRecordCard && !refetch) return this.gameRecordCard;

    const res = await newAxiosInstance().get<GameRecordCardResponse>(
      this.Constants.URLS.gameRecordCard,
      {
        params: {
          uid: this.#ltuid_v2,
        },
        headers: {
          ...this.defaultHeaders,
          'x-rpc-language': this.lang,
        },
      },
    );
    const axiosData = res.data;
    if (res.status !== 200) throw this.error(`Failed to fetch Game Record Card.`, axiosData);
    this.handleRetcodeOnResponse(axiosData);
    return (this.gameRecordCard = axiosData.data);
  }

  toObject() {
    return {
      ltoken_v2: this.#ltoken_v2,
      ltuid_v2: this.#ltuid_v2,
      lang: this.lang,
    };
  }
}

export default HoyolabService;

/**
 * API response from Hoyolab when requesting.
 */
interface HoyolabResponse<T> {
  data: T;
  message: string;
  retcode: number;
}

interface CalendarAward {
  icon: string;
  name: string;
  cnt: number; // count of the award
}
interface CalendarResponse {
  month: number;
  awards: CalendarAward[];
}
interface ShortExtraAward {
  has_extra_award: boolean;
  start_time: string;
  end_time: string;
  list: [];
  start_timestamp: string;
  end_timestamp: string;
}
type ZZZCalendarResponse = HoyolabResponse<
  CalendarResponse & {
    resign: boolean;
    biz: 'zzz';
    short_extra_award: ShortExtraAward;
  }
>;
type HSRCalendarResponse = HoyolabResponse<
  CalendarResponse & {
    resign: boolean;
    biz: 'hkrpg';
    short_extra_award: ShortExtraAward;
  }
>;
type GICalendarResponse = HoyolabResponse<
  CalendarResponse & {
    resign: boolean;
    now: string; // timestamp
  }
>;
type HI3CalendarResponse = HoyolabResponse<CalendarResponse>;

interface InfoResponse {
  total_sign_day: number;
  today: string; // YYYY-MM-DD
  is_sign: boolean;
  is_sub: boolean;
  region: string;
}
type ZZZInfoResponse = HoyolabResponse<
  InfoResponse & {
    sign_cnt_missed: number;
    short_sign_day: number;
    send_first: boolean;
  }
>;
type HSRInfoResponse = HoyolabResponse<
  InfoResponse & {
    sign_cnt_missed: number;
    short_sign_day: number;
    send_first: boolean;
  }
>;
type GIInfoResponse = HoyolabResponse<
  InfoResponse & {
    first_bind: boolean;
    month_last_day: boolean;
  }
>;
type HI3InfoResponse = HoyolabResponse<
  InfoResponse & {
    first_bind: boolean;
  }
>;

type ZZZCheckInResponse = HoyolabResponse<{
  code: string;
  risk_code: number;
  gt: string;
  challenge: string;
  success: number;
  is_risk: boolean;
}>;
type HSRCheckInResponse = HoyolabResponse<unknown>; // todo: implement the correct type
type GICheckInResponse = HoyolabResponse<{
  code: string;
  first_bind: boolean;
  gt_result: {
    risk_code: number;
    gt: string;
    challenge: string;
    success: number;
    is_risk: boolean;
  };
}>;
type HI3CheckInResponse = HoyolabResponse<unknown>; // todo: implement the correct type

interface GameRecordDataItem {
  name: string;
  type: number;
  value: string;
}
interface DataSwitch {
  switch_id: number;
  is_public: boolean;
  switch_name: string;
}
interface GameRecordCard {
  has_role: boolean;
  game_id: number;
  game_role_id: string;
  nickname: string;
  region: string;
  region_name: string;
  level: number;
  is_public: boolean;
  background_image: string;
  background_image_v2: string;
  background_color: string;
  logo: string;
  game_name: string;
  url: string;
  data: GameRecordDataItem[];
  data_switches: DataSwitch[];
  h5_data_switches: DataSwitch[];
}
interface GameRecordCardList {
  list: GameRecordCard[];
}
type GameRecordCardResponse = HoyolabResponse<GameRecordCardList>;
