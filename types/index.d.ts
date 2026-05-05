import type { ClientOptions, ContextMenuCommandBuilder, SlashCommandBuilder } from 'discord.js';
import BotClient from '../src/BotClient.ts';
import AutoCompleteInteraction from '../src/utilities/interaction/autocomplete.interaction.ts';
import CommandInteraction from '../src/utilities/interaction/command.interaction.ts';
import ContextMenuInteraction from '../src/utilities/interaction/contextmenu.interaction.ts';
import _logger from '../src/utilities/logger.ts';

export declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      DISCORD_TOKEN: string;
      MONGODB_URI: string;
      MONGODB_NAME: string;
    }
  }

  var logger: ReturnType<typeof _logger>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BotClientOptions extends ClientOptions {}

export interface EventHandler<Args extends unknown[] = unknown[]> {
  /**
   * indicates whether this Event is enabled or not
   */
  status: boolean;
  /**
   * indicates whether this Event should be executed only once or not
   */
  once: boolean;
  run(client: BotClient, ...args: Args): Promise<void>;
}

export interface SlashCommandHandler {
  /**
   * indicates whether this Slash Command is enabled or not
   */
  status: boolean;
  /**
   * metadata for the Slash Command
   */
  metadata: SlashCommandBuilder;
  run: (interaction: CommandInteraction) => Promise<void>;
  /**
   * function to run when the Slash Command's autocomplete is triggered
   */
  autoComplete?: (interaction: AutoCompleteInteraction) => Promise<void>;
}

export interface ContextMenuHandler {
  /**
   * indicates whether this Context Menu is enabled or not
   */
  status: boolean;
  /**
   * metadata for the Context Menu
   */
  metadata: ContextMenuCommandBuilder;
  run: (interaction: ContextMenuInteraction) => Promise<void>;
}
