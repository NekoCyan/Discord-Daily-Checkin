import axios from 'axios';
import crypto from 'node:crypto';
import { newAxiosInstance } from '../utilities/Request.js';
import BaseService from './baseService.js';

export interface EndfieldServiceOptions {
  accountToken: string;
  cred?: string;
}

/**
 * @link https://github.com/Areha11Fz/ArknightsEndfieldAutoCheckIn/blob/main/EndfieldAutoCheckIn.js
 */
class EndfieldService extends BaseService {
  #accountToken: string = '';
  cred: string = '';
  oAuthCode: string = '';
  token: string = '';
  binding: PlayerBinding | null = null;

  constructor(options?: EndfieldServiceOptions) {
    super();

    if (options) {
      this.#accountToken = options.accountToken;
      this.cred = options.cred ?? '';
    }
  }

  static get Constants() {
    return {
      APP_CODE: '6eb76d4e13aa36e6',
      PLATFORM: '3',
      VNAME: '1.0.0',
      ENDFIELD_GAME_ID: '3',
      URLS: {
        THIRD_PARTY_INFO: 'https://as.gryphline.com/user/info/v1/third_party',
        GRANT: 'https://as.gryphline.com/user/oauth2/v2/grant',
        GENERATE_CRED: 'https://zonai.skport.com/web/v1/user/auth/generate_cred_by_code',
        REFRESH_TOKEN: 'https://zonai.skport.com/web/v1/auth/refresh',
        BINDING: 'https://zonai.skport.com/api/v1/game/player/binding',
        ATTENDANCE: 'https://zonai.skport.com/web/v1/game/endfield/attendance',
        USER_CHECK: 'https://zonai.skport.com/web/v1/user/check',
        USER_INFO: 'https://zonai.skport.com/web/v2/user',
      },
    };
  }

  get Constants() {
    return EndfieldService.Constants;
  }

  get defaultHeaders() {
    return {
      'content-type': 'application/json',
    };
  }

  get gryplineHeaders() {
    return {
      ...this.defaultHeaders,
      'x-language': 'en-us',
    };
  }

  get skportHeaders() {
    return {
      ...this.defaultHeaders,
      'sk-language': 'en',
      vname: this.Constants.VNAME,
    };
  }

  /**
   * Get the player binding code for Endfield game in the format of `${gameId}_${roleId}_${serverId}`.
   */
  get bindingCode() {
    if (!this.binding)
      throw this.error(
        'Player binding is not set. Please call getPlayerBinding() first to retrieve and set the binding information.',
      );

    const endfieldApp = this.binding.list.find((app) => app.appCode === 'endfield');
    if (!endfieldApp || !endfieldApp.bindingList || endfieldApp.bindingList.length === 0) {
      throw this.error('No valid player binding found for Endfield game.', {
        binding: this.binding,
      });
    }
    const binding = endfieldApp.bindingList[0];
    const role = binding?.defaultRole ?? binding?.roles?.[0];

    if (!role)
      throw this.error('No valid role found in Endfield binding.', {
        role: role,
      });

    return `${this.Constants.ENDFIELD_GAME_ID}_${role.roleId}_${role.serverId}`;
  }

  async IsValidAccountToken() {
    if (!this.#accountToken) throw this.error('Account token is required to perform this action.');

    const res = await newAxiosInstance().get<ThirdPartyInfoResponse>(
      this.Constants.URLS.THIRD_PARTY_INFO,
      {
        headers: this.gryplineHeaders,
        params: {
          token: this.#accountToken,
        },
      },
    );

    const axiosData = res.data;

    return res.status < 400 && axiosData?.status === 0;
  }

  /**
   * Generate an OAuth code using the account token to grypline's API, then
   * store the code in `this.oAuthCode`.
   * @returns The obtained OAuth code.
   * @throws If the account token is not set or if the API request fails.
   */
  async generateOAuthCode() {
    if (!this.#accountToken) throw this.error('Account token is required to perform this action.');

    const res = await newAxiosInstance().post<OAuthGrantedResponse>(
      this.Constants.URLS.GRANT,
      {
        appCode: this.Constants.APP_CODE,
        type: 0,
        token: this.#accountToken,
      },
      {
        headers: this.gryplineHeaders,
      },
    );

    const axiosData = res.data;

    if (res.status >= 400)
      throw this.error('Failed to get OAuth code from Grypline API.', axiosData);

    const code = axiosData?.data?.code;
    if (!code) throw this.error('No OAuth code received from Grypline API.');

    return (this.oAuthCode = code);
  }

  /**
   * Generate a new CRED using the stored OAuth code by making a request
   * to Skport's API, then store the CRED in `this.cred`.
   * @returns The generated CRED.
   * @throws If the OAuth code is not set or if the API request fails.
   * @note This method will automatically call `generateOAuthCode()` if `this.oAuthCode` is not set.
   */
  async generateCred() {
    if (!this.oAuthCode) await this.generateOAuthCode();

    const res = await newAxiosInstance().post<GeneratedCredResponse>(
      this.Constants.URLS.GENERATE_CRED,
      {
        kind: 1,
        code: this.oAuthCode,
      },
      {
        headers: this.skportHeaders,
      },
    );

    const axiosData = res.data;

    if (res.status >= 400) throw this.error('Failed to generate CRED from Skport API.', axiosData);

    const cred = axiosData.data?.cred;
    if (!cred) throw this.error('No CRED received from Skport API.');

    // Clear the OAuth code after using it to generate CRED,
    // as it's no longer needed and should not be reused.
    this.oAuthCode = '';
    if (axiosData.data?.token) this.token = axiosData.data.token;
    return (this.cred = cred);
  }

  /**
   * Get a current sign token based on the CRED from Skport's API,
   * then store the token in `this.token`.
   * @returns The obtained sign token.
   * @throws If the CRED is not set or if the API request fails.
   * @note This method will automatically call `generateCred()` if `this.cred` is not set.
   */
  async getSignToken() {
    /**
     * As I tested this api endpoint will return the same token
     * across requests, so maybe it's effected by the timestamp with
     * a short lifespan. Request cred will also return token so ~
     */
    if (!this.cred) await this.generateCred();

    const ts = Math.floor(Date.now() / 1000).toString();

    const res = await newAxiosInstance().get<GetSignTokenResponse>(
      this.Constants.URLS.REFRESH_TOKEN,
      {
        headers: {
          ...this.skportHeaders,
          cred: this.cred,
          platform: this.Constants.PLATFORM,
          timestamp: ts,
        },
      },
    );

    const axiosData = res.data;

    if (res.status >= 400) throw this.error('Failed to get sign token from Skport API.', axiosData);

    const token = axiosData.data?.token;
    if (!token) throw this.error('No sign token received from Skport API.');

    return (this.token = token);
  }

  /**
   * Generate the necessary headers for making as authorized requests to Skport's API,
   * @param url The full URL of the API endpoint you want to call, used for computing the sign header.
   * @param withBinding Whether to include the player's binding code in the headers.
   * @returns An object containing the authorized headers: `cred`, `platform`, `timestamp`, and `sign`.
   * @throws If the CRED or sign token is not set.
   * @note This method requires both `this.cred` and `this.token` to be set, so it will throw an error if either of them is missing. Make sure to call `generateCred()` and `getSignToken()` before using this method.
   */
  AuthorizedHeaders(
    url: string,
    withBinding?: true,
  ): {
    cred: string;
    platform: string;
    timestamp: string;
    sign: string;
    'sk-game-role'?: string;
  };
  AuthorizedHeaders(
    url: string,
    withBinding: false,
  ): {
    cred: string;
    platform: string;
    timestamp: string;
    sign: string;
  };
  AuthorizedHeaders(
    url: string,
    withSkGameRole: boolean = true,
  ): {
    cred: string;
    platform: string;
    timestamp: string;
    sign: string;
    'sk-game-role'?: string;
  } {
    if (!this.cred)
      throw this.error(
        'CRED is required to generate authorized headers. Please call generateCred() first.',
      );
    if (!this.token)
      throw this.error(
        'Sign token is required to generate authorized headers. Please call getSignToken() first.',
      );

    const ts = Math.floor(Date.now() / 1000).toString();
    const path = new URL(url).pathname;
    const sign = this.#computeSign(path, '', ts, this.token);

    const obj: {
      cred: string;
      platform: string;
      timestamp: string;
      sign: string;
      'sk-game-role'?: string;
    } = {
      cred: this.cred,
      platform: this.Constants.PLATFORM,
      timestamp: ts,
      sign,
    };

    if (withSkGameRole) obj['sk-game-role'] = this.bindingCode;

    return obj;
  }

  /**
   * Get the player's binding information for Endfield game from Skport's API.
   * @returns The player's binding string in the format of `${gameId}_${roleId}_${serverId}` if found, otherwise null.
   * @throws If the CRED or sign token is not set or if the API request fails.
   * @note This method will automatically call `generateCred()` and `getSignToken()` if `this.cred` or `this.token` is not set, respectively.
   */
  async getPlayerBinding() {
    if (!this.cred) await this.generateCred();
    // Generate cred should also generate token belong with it.
    // But just in case, if token is not set, get a new one.
    if (!this.token) await this.getSignToken();

    const authorizedHeaders = this.AuthorizedHeaders(this.Constants.URLS.BINDING, false);

    const res = await newAxiosInstance().get<PlayerBindingResponse>(this.Constants.URLS.BINDING, {
      headers: {
        ...this.skportHeaders,
        ...authorizedHeaders,
      },
    });

    const axiosData = res.data;

    // Skport API returns 200 status code even when there's an error,
    // so we need to check the `code` field in the response data as well.
    if (res.status >= 400 || axiosData.code !== 0)
      throw this.error('Failed to get player binding from Skport API.', axiosData);

    return (this.binding = axiosData.data);
  }

  /**
   * Get the player's attendance information for Endfield game from Skport's API.
   * @returns The attendance information object if the request is successful.
   * @throws If the player binding is not set or if the API request fails.
   * @note This method will automatically call `getPlayerBinding()` if `this.binding` is not set.
   */
  async getAttendance() {
    if (!this.binding) await this.getPlayerBinding();

    const url = this.Constants.URLS.ATTENDANCE;
    const authorizedHeaders = this.AuthorizedHeaders(url);

    const res = await axios.get<GetAttendanceResponse>(url, {
      headers: {
        ...this.skportHeaders,
        ...authorizedHeaders,
      },
    });

    return res?.data?.data;
  }

  /**
   * Send the attendance reward claim request.
   * @returns The attendance reward claim response object if the request is successful.
   * @throws If the player binding is not set or if the API request fails.
   * @note This method will automatically call `getPlayerBinding()` if `this.binding` is not set.
   */
  async sendAttendance() {
    if (!this.binding) await this.getPlayerBinding();

    const url = this.Constants.URLS.ATTENDANCE;
    const authorizedHeaders = this.AuthorizedHeaders(url);

    const res = await newAxiosInstance().post<SendAttendanceResponse>(url, undefined, {
      headers: {
        ...this.skportHeaders,
        ...authorizedHeaders,
      },
    });

    const axiosData = res.data;

    if (res.status >= 400) throw this.error('Failed to send attendance reward request.', axiosData);

    return axiosData.data;
  }

  /**
   * Get the user's Skport user check information.
   * @returns The user check information object if the request is successful.
   * @throws If the CRED or sign token is not set, or if the API request fails.
   * @note This method will automatically call `generateCred()` and `getSignToken()` if `this.cred` or `this.token` is not set, respectively.
   */
  async getSkportUserCheck() {
    if (!this.cred) await this.generateCred();
    if (!this.token) await this.getSignToken();

    const url = this.Constants.URLS.USER_CHECK;
    const authorizedHeaders = this.AuthorizedHeaders(url);

    const res = await newAxiosInstance().get<SkportUserCheckResponse>(url, {
      headers: {
        ...this.skportHeaders,
        ...authorizedHeaders,
      },
    });

    const axiosData = res.data;

    if (res.status >= 400) throw this.error('Failed to get user check.', axiosData);

    return axiosData.data;
  }

  /**
   * Get the user's Skport user information.
   * @returns The user information object if the request is successful.
   * @throws If the CRED or sign token is not set, or if the API request fails.
   * @note This method will automatically call `generateCred()` and `getSignToken()` if `this.cred` or `this.token` is not set, respectively.
   */
  async getSkportUser() {
    if (!this.cred) await this.generateCred();
    if (!this.token) await this.getSignToken();

    const url = this.Constants.URLS.USER_INFO;
    const authorizedHeaders = this.AuthorizedHeaders(url);

    const res = await newAxiosInstance().get<SkportUserResponse>(url, {
      headers: {
        ...this.skportHeaders,
        ...authorizedHeaders,
      },
    });

    const axiosData = res.data;

    if (res.status >= 400) throw this.error('Failed to get user.', axiosData);

    return axiosData.data;
  }

  /**
   * Get the user's Endfield in-game information from Skport's API, which may include the player's nickname, level, server, and other relevant details.
   * @returns The Endfield user information object if the request is successful.
   * @throws If the player binding is not set or if the API request fails.
   */
  async getEndfieldUserInfo() {
    if (!this.binding) await this.getPlayerBinding();

    const user = this.binding!.list?.[0]?.bindingList?.[0]?.defaultRole;
    if (!user) throw this.error('No valid player binding found for Endfield game.');

    return {
      userId: user.roleId,
      nickname: user.nickname,
      level: user.level,
      isBanned: user.isBanned,
      serverType: user.serverType,
      serverName: user.serverName,
    };
  }

  /**
   * Compute the sign header value based on the request path, body, timestamp, and sign token using the following steps:
   * @param path The URL path of the API endpoint (e.g., `/web/v1/game/endfield/attendance`).
   * @param body The request body as a JSON string. For GET requests, this can be an empty string.
   * @param timestamp The current timestamp as a string (e.g., `Math.floor(Date.now() / 1000).toString()`).
   * @param signToken The sign token obtained from Skport's API.
   * @returns The computed sign value as a hexadecimal string.
   */
  #computeSign(path: string, body: string, timestamp: string, signToken: string): string {
    const headerObj = {
      platform: EndfieldService.Constants.PLATFORM,
      timestamp,
      dId: '',
      vName: EndfieldService.Constants.VNAME,
    };

    const headersJson = JSON.stringify(headerObj);
    const signString = path + body + timestamp + headersJson;

    // HMAC-SHA256
    const hmacHex = crypto.createHmac('sha256', signToken).update(signString).digest('hex');

    // MD5 of hmacHex
    const md5Bytes = crypto.createHash('md5').update(hmacHex, 'utf8').digest();

    return md5Bytes.toString('hex');
  }

  /**
   * Convert the current state of the EndfieldService instance to a plain object,
   * which can be useful for debugging, logging or save to database.
   * @returns A plain object representing the current state of the EndfieldService instance.
   */
  toObject() {
    return {
      accountToken: this.#accountToken,
      cred: this.cred,
      token: this.token,
    };
  }
}

export default EndfieldService;

/**
 * API response from as.grypline.com when requesting.
 */
interface GryplineResponse<T> {
  data: T;
  msg: string;
  status: number;
  type: string;
}

/**
 * API response from zoneai.skport.com when requesting.
 */
interface SkportResponse<T> {
  code: number;
  message: string;
  timestamp: string;
  data: T;
}

type ThirdPartyInfoResponse = GryplineResponse<{
  thirdPartyInfo: [];
}>;

type OAuthGrantedResponse = GryplineResponse<{
  uid: string;
  code: string;
}>;

type GeneratedCredResponse = SkportResponse<{
  cred: string;
  userId: string;
  token: string;
}>;

type GetSignTokenResponse = SkportResponse<{
  token: string;
}>;

interface RoleInfo {
  serverId: string;
  roleId: string;
  nickname: string;
  level: number;
  isDefault: boolean;
  isBanned: boolean;
  serverType: string;
  serverName: string;
}
interface PlayerBinding {
  list: [
    {
      appCode: string;
      appName: string;
      bindingList: {
        uid: string;
        isOfficial: boolean;
        isDefault: boolean;
        channelMasterId: string;
        channelName: string;
        nickName: string;
        isDelete: boolean;
        gameName: string;
        gameId: number;
        roles: RoleInfo[];
        defaultRole: RoleInfo;
      }[];
    },
  ];
  serverDefaultBinding: object;
}
type PlayerBindingResponse = SkportResponse<PlayerBinding>;

interface AttendanceItem {
  awardId: string;
  available: boolean;
  done: boolean;
}
interface ResourceInfo {
  id: string;
  count: number;
  name: string;
  icon: string;
}
type GetAttendanceResponse = SkportResponse<{
  currentTs: string;
  calendar: AttendanceItem[];
  first: AttendanceItem[];
  resourceInfoMap: Record<string, ResourceInfo>;
  hasToday: boolean;
}>;
interface AwardIdItem {
  id: string;
  type: number;
}
type SendAttendanceResponse = SkportResponse<{
  awardIds: AwardIdItem[];
  resourceInfoMap: Record<string, ResourceInfo>;
  tomorrowAwardIds: AwardIdItem[];
}>;

type SkportUserCheckResponse = SkportResponse<{
  policyList: [];
  isNewUser: boolean;
  nickname: string;
}>;

interface SkportBasicUser {
  id: string;
  nickname: string;
  profile: string;
  avatarCode: number;
  avatar: string;
  gender: number;
  status: number;
  operationStatus: number;
  identity: number;
  kind: number;
  moderatorStatus: number;
  moderatorChangeTime: number;
  createdAt: string;
  latestLoginAt: string;
}
interface SkportUserPendant {
  id: number;
  iconUrl: string;
  title: string;
  description: string;
}
interface SkportUserRts {
  follow: string;
  fans: string;
  liked: string;
}
interface SkportModerator {
  isModerator: boolean;
  operations: [];
  role: string;
  since: string;
  status: number;
  gameOperations: object;
}
type SkportUserResponse = SkportResponse<{
  user: {
    basicUser: SkportBasicUser;
    pendant: SkportUserPendant;
    background: null;
  };
  userRts: SkportUserRts;
  userSanctionList: [];
  userInfoApply: object;
  moderator: SkportModerator;
}>;
