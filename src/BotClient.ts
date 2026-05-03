import { APIApplicationCommand, Client, Collection, Options } from 'discord.js';
import path from 'node:path';
import { BotClientOptions, SlashCommandHandler } from '../types/index.js';
import { entryPath } from './entryPath.js';
import { resolveDynamicImportPath } from './utilities/utils.js';

const handlerPath = path.resolve(entryPath, './handler');
const allHandlers = ['events', 'commandRegistration'];

export default class BotClient extends Client<true> {
  /**
   * Indicates whether the bot is logged in or not.
   */
  isLogged: boolean = false;
  /**
   * Indicates whether the bot is fully ready (i.e., has loaded all data from
   * database or other necessary resources) before accepting interactions or commands.
   */
  isFullyReady: boolean = false;
  /**
   * The bot token used for authentication. This is a private
   * field and should not be accessed directly outside of the class.
   */
  token: string = '';

  slashCommands = new Collection<string, SlashCommandHandler>();
  slashCommandsRequested = new Collection<string, APIApplicationCommand>();

  constructor(options: BotClientOptions) {
    super(options);
    this.options = {
      ...this.options,
      makeCache: Options.cacheWithLimits({
        VoiceStateManager: 0,
        UserManager: 0,
        ThreadMemberManager: 0,
        ThreadManager: 0,
        StageInstanceManager: 0,
        ReactionUserManager: 0,
        ReactionManager: 0,
        PresenceManager: 0,
        MessageManager: 0,
        GuildTextThreadManager: 0,
        GuildStickerManager: 0,
        GuildScheduledEventManager: 0,
        GuildMessageManager: 0,
        GuildMemberManager: 0,
        GuildInviteManager: 0,
        GuildBanManager: 0,
        GuildEmojiManager: 0,
        ApplicationCommandManager: 0,
        ApplicationEmojiManager: 0,
        AutoModerationRuleManager: 0,
        BaseGuildEmojiManager: 0,
        DMMessageManager: 0,
        EntitlementManager: 0,
        GuildForumThreadManager: 0,
      }),
    };
  }

  /**
   * Handles the loading of event and command handlers. It iterates through
   * the list of handlers, dynamically imports each handler module, and executes
   * the default export function of each module, passing the current instance of
   * the bot client.
   */
  async Handler() {
    for (const handler of allHandlers) {
      const groupedPath = path.join(handlerPath, handler);
      const resolvedPath = resolveDynamicImportPath(groupedPath);
      const imported = await import(resolvedPath);
      await imported.default(this);
    }
  }

  override login(): Promise<string> {
    throw new Error(`Please use the 'Login' method instead.`);
  }

  async Login(token: string): Promise<boolean> {
    this.token = token;
    if (!this.token) throw new Error('No bot token provided.');

    await this.Handler();

    logger.info(`Bot token authorizing...`, 'bot-login');
    const authorized = await super.login(this.token);
    logger.info(`Bot token authorized | ${authorized.split('.')[0]}`, 'bot-login');

    logger.info(`Waiting for the bot to be fully ready...`, 'prepare-fully-ready');

    return (this.isLogged = true);
  }
}
