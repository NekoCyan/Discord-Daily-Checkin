import { APIApplicationCommand, Client, Collection, Options } from 'discord.js';
import path from 'node:path';
import {
  BatchCheckInOptions,
  BotClientOptions,
  ButtonHandler,
  ContextMenuHandler,
  SlashCommandHandler,
} from '../types/index.js';
import { entryPath } from './entryPath.js';
import { resolveDynamicImportPath } from './utilities/Utils.js';

const handlerPath = path.resolve(entryPath, './handler');
const allHandlers = ['events', 'commandRegistration', 'buttons'];

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

  buttons = new Collection<string, ButtonHandler>();
  slashCommands = new Collection<string, SlashCommandHandler>();
  slashCommandsRequested = new Collection<string, APIApplicationCommand>();
  contextMenus = new Collection<string, ContextMenuHandler>();
  contextMenusRequested = new Collection<string, APIApplicationCommand>();

  batchCheckInOptions: Required<BatchCheckInOptions>;

  constructor(options: BotClientOptions) {
    super({
      ...options,
      // I disable caching all cuz of 1gb ram hosting ehe ~
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
    });

    this.batchCheckInOptions = this.#_validateBatchCheckInOptions(options.batchCheckInOptions);
  }

  #_validateBatchCheckInOptions(options?: BatchCheckInOptions) {
    const defaultOptions = {
      batchSize: 10,
      delayPerBatchMs: 0,
      concurrency: 1,
    };

    if (!options) return defaultOptions;

    if ('batchSize' in options) {
      if (options.batchSize <= 0) throw new Error('batchSize must be a positive number.');
    }

    if ('delayPerBatchMs' in options) {
      if (options.delayPerBatchMs < 0)
        throw new Error('delayPerBatchMs must be a non-negative number.');
    }

    if ('concurrency' in options) {
      if (options.concurrency <= 0) throw new Error('concurrency must be a positive number.');
    }

    return {
      ...defaultOptions,
      ...options,
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

  /**
   * Mentions a slash command in the format of `</command subcommand:command_id>` if it exists in the requested slash commands.
   * Otherwise, it returns the raw string.
   * @param name The name of the slash command, including subcommands if any (e.g., "command subcommand").
   * @returns The mention string for the slash command if found, or the raw name if not found.
   */
  mentionSlashCommand(name: string): string {
    const [commandName, ...subParts] = name.split(' ');
    const subcommand = subParts.join(' '); // handles multi-word subcommands

    // Check slash commands first
    const slash = this.slashCommandsRequested.find((cmd) => cmd.name === commandName);
    if (slash) {
      if (subcommand) return `</${commandName} ${subcommand}:${slash.id}>`;
      return `</${slash.name}:${slash.id}>`;
    }

    // Return the raw string when nothing is found
    return name;
  }
}
