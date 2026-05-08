import type { ClientOptions, ContextMenuCommandBuilder, SlashCommandBuilder } from 'discord.js';
import BotClient from '../src/BotClient.ts';
import AutoCompleteInteraction from '../src/utilities/interaction/autocomplete.interaction.ts';
import ButtonInteraction from '../src/utilities/interaction/button.interaction.ts';
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

export interface BotClientOptions extends ClientOptions {
  batchCheckInOptions?: BatchCheckInOptions;
}

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

export interface ButtonHandler {
  /**
   * indicates whether this Button is enabled or not
   */
  status: boolean;
  /**
   * id of the button, Discord would treat this as the customId of the button.
   * This should be unique among all buttons.
   * Use this id to identify which button is clicked in the interaction handler.
   */
  id: string;
  run(interaction: ButtonInteraction): Promise<void>;
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

export interface BatchCheckInOptions {
  /**
   * Optional batch of users size to do check-in, default to 10
   */
  batchSize?: number;
  /**
   * Optional delay between batches in milliseconds, default to 0ms (no delay)
   */
  delayPerBatchMs?: number;
  /**
   * Optional number of concurrent batches, default to 1 (no concurrency)
   */
  concurrency?: number;
}
