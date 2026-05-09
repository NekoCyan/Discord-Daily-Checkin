import type {
  ButtonStyle,
  ClientOptions,
  ContextMenuCommandBuilder,
  InteractionReplyOptions,
  SlashCommandBuilder,
} from 'discord.js';
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

type Defined<T> = {
  [K in keyof T]-?: NonNullable<T[K]>;
};

export interface BotClientOptions extends ClientOptions {
  batchCheckInOptions: BatchCheckInOptions;
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
  batchSize: number | undefined;
  /**
   * Optional delay between batches in milliseconds, default to 0ms (no delay)
   */
  delayPerBatchMs: number | undefined;
  /**
   * Optional number of concurrent batches, default to 1 (no concurrency)
   */
  concurrency: number | undefined;
}
export type QualifiedBatchCheckInOptions = Defined<BatchCheckInOptions>;

export interface CurrentTotal {
  current: number;
  total: number;
}

export interface KeyValue {
  key: string;
  value: string;
}

export interface CountTotal {
  count: number;
  total: number;
}

/**
 * Subset of `PageEntry` fields that `fetch()` can override dynamically by
 * returning a `PageFetchResult` instead of plain data.
 */
export interface PageMeta {
  label?: string;
  style?: ButtonStyle;
  once?: boolean;
  onceBehavior?: 'disable' | 'remove';
}

/**
 * Opaque wrapper returned by `pageResult()`. Carries both the fetched data and
 * optional metadata overrides that will be applied to the live page entry
 * after each fetch — letting you change a page's label, style, or once
 * behaviour dynamically at runtime.
 *
 * @internal Construct via the `pageResult()` helper, never by hand.
 */
export interface PageFetchResult<T> {
  readonly __tag: 'PageFetchResult';
  data: T;
  meta: PageMeta;
}

/**
 * Represents a single page (or action button) in a PageController session.
 *
 * - If `render` is provided the entry acts as a **navigation page**.
 * - If `render` is omitted the entry acts as an **action / refresh button**:
 *   it runs `fetch()` as a side-effect and then re-renders the current page.
 */
export interface PageEntry<T = unknown> {
  /** Label shown on the navigation button. */
  label: string;
  /** Cache the fetched data so revisiting the page skips the network call. Default: `true`. */
  cache?: boolean;
  /** Discord button style. Default: `ButtonStyle.Secondary`. */
  style?: ButtonStyle;
  /** Action-button only — allow only one press per controller session. Default: `false`. */
  once?: boolean;
  /** What happens after a `once` action fires: `'disable'` grays it out, `'remove'` hides it. Default: `'disable'`. */
  onceBehavior?: 'disable' | 'remove';
  /**
   * Async function that fetches the data needed by this page or performs the action.
   * Return a plain value or wrap it with `pageResult(data, meta)` to also
   * dynamically override this page's `label`, `style`, `once`, or `onceBehavior`.
   */
  fetch: () => Promise<T | PageFetchResult<T>>;
  /** Transforms the fetched data into a reply payload. Omit to make this an action button. */
  render?: (data: T) => InteractionReplyOptions;
}

export interface PageControllerOptions {
  /** Index of the page shown on first render. Falls back to the first render-capable entry. Default: `0`. */
  initialPage?: number;
  /** Collector lifetime in milliseconds. Default: `180_000` (3 min). */
  timeout?: number;
  /** Prefix for button custom IDs, prevents collisions when multiple controllers are active. Default: `'pgctrl'`. */
  idPrefix?: string;
}
