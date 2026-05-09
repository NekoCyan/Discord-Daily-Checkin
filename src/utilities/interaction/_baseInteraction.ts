import {
  ActionRowBuilder,
  AnySelectMenuInteraction,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  ComponentType,
  ContextMenuCommandInteraction,
  InteractionCollector,
  InteractionReplyOptions,
  InteractionUpdateOptions,
  Message,
  MessageEditOptions,
  MessageFlags,
  ModalSubmitInteraction,
  User,
} from 'discord.js';
import type { PageControllerOptions, PageEntry } from '../../../types/index.js';
import BotClient from '../../BotClient.js';
import { isPageFetchResult } from './_helper.js';

class BaseInteraction<
  AnyInteraction extends
    | CommandInteraction
    | AutocompleteInteraction
    | ButtonInteraction
    | ModalSubmitInteraction
    | ContextMenuCommandInteraction
    | AnySelectMenuInteraction,
> {
  client: BotClient;
  interaction: AnyInteraction;

  constructor(client: BotClient, interaction: AnyInteraction) {
    this.client = client;
    this.interaction = interaction;
  }

  /**
   * A method to send a reply to the interaction or edit the reply if it has already been replied to or deferred.
   * @param msg The content to send as a reply, or an InteractionReplyOptions object for additional options. If msg is a boolean, it will be treated as the ephemeral flag for deferring the reply.
   * @param options If msg is a string, this can be either a boolean indicating whether the reply should be ephemeral or an InteractionReplyOptions object for additional options. If msg is an InteractionReplyOptions object, this parameter can be used to specify whether the reply should be ephemeral.
   * @param ephemeral Whether the reply should be ephemeral. This parameter is only used if msg is a string or if options is an InteractionReplyOptions object.
   * @returns A promise that resolves to the sent or edited message, or void if the interaction is not repliable.
   */
  async SendOrEdit(
    msg: string | boolean | InteractionReplyOptions,
    options?: boolean | InteractionReplyOptions,
    ephemeral: boolean = false,
  ) {
    const int = this.interaction;

    if (!int.isRepliable()) return;

    const ephemeralFlag = (bool: boolean) => (bool ? MessageFlags.Ephemeral : undefined);

    // Merges multiple flags together (e.g. Ephemeral | IsComponentsV2)
    const mergeFlags = (...flags: (MessageFlags | number | undefined)[]) => {
      const result = flags
        .filter((f): f is number => f !== undefined)
        .reduce((acc, f) => acc | f, 0);
      return result || undefined;
    };

    if (int.replied || int.deferred) {
      // Ephemeral is not working in editReply, so we strip it but keep other flags.
      if (typeof msg === 'boolean')
        throw new Error(`The interaction has already been replied to or deferred.`);
      if (typeof msg === 'object') {
        const { flags, ...rest } = msg;
        return int.editReply({
          ...rest,
          flags: mergeFlags(
            typeof flags === 'number' ? flags : undefined,
            // Strip ephemeral only
            ...(typeof flags === 'number' ? [flags & ~MessageFlags.Ephemeral] : []),
          ),
        });
      } else if (typeof options === 'object') {
        const { flags, ...rest } = options;
        return int.editReply({
          ...rest,
          content: msg,
          flags: typeof flags === 'number' ? flags & ~MessageFlags.Ephemeral : undefined,
        });
      } else return int.editReply({ content: msg });
    } else {
      if (typeof msg === 'boolean') return int.deferReply({ flags: ephemeralFlag(msg) });
      else if (typeof msg === 'object') {
        const { flags, ...rest } = msg;
        const resolvedEphemeral = typeof options === 'boolean' ? options : ephemeral;
        return int.reply({
          ...rest,
          flags: mergeFlags(
            typeof flags === 'number' ? flags : undefined,
            ephemeralFlag(resolvedEphemeral),
          ),
        });
      } else if (typeof options === 'boolean')
        return int.reply({ content: msg, flags: ephemeralFlag(options) });
      else if (typeof options === 'object') {
        const { flags, ...rest } = options;
        return int.reply({
          ...rest,
          content: msg,
          flags: mergeFlags(
            typeof flags === 'number' ? flags : undefined,
            ephemeralFlag(ephemeral),
          ),
        });
      } else return int.reply({ content: msg, flags: ephemeralFlag(ephemeral) });
    }
  }

  /**
   * A helper method to prevent commands on the bot if targetted, it will reply with an error
   * message if the target user is a bot.
   * @param targetUser The user to check.
   * @returns true if the interaction user is interacting to a bot, false otherwise.
   */
  async PreventCommandOnBot(targetUser: User) {
    if (targetUser.bot) {
      await this.SendOrEdit('Performing this action on a bot is not allowed.', true);
      return true;
    }
    return false;
  }

  /**
   * One live controller per user. Stored so a new interaction call can evict
   * the old one immediately instead of waiting for timeout (saves RAM).
   */
  private static activeControllers = new Map<
    string,
    { collector: InteractionCollector<ButtonInteraction>; message: Message }
  >();

  /**
   * Builds the navigation `ActionRowBuilder` for the current controller state.
   *
   * - Page buttons are disabled when they are the active page.
   * - Action buttons respect `once` / `onceBehavior`.
   * - When `disabled` is `true` (session expired) all buttons are disabled.
   */
  private buildNavRow(
    pages: PageEntry[],
    currentIndex: number,
    idPrefix: string,
    disabled: boolean,
    usedOnce: Set<number>,
  ): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (!page) continue;

      const isAction = !page.render;
      const isConsumed = isAction && !!page.once && usedOnce.has(i);

      // `remove` behavior — omit the button from the row entirely.
      if (isConsumed && page.onceBehavior === 'remove') continue;

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`${idPrefix}-${i}`)
          .setLabel(page.label)
          .setStyle(page.style ?? ButtonStyle.Secondary)
          .setDisabled(disabled || (!isAction && i === currentIndex) || isConsumed),
      );
    }
    return row;
  }

  /**
   * Appends `row` to the `components` array of `payload` and returns the
   * merged payload. Works for both normal replies and Components V2 replies.
   */
  private injectNavRow(
    payload: InteractionReplyOptions,
    row: ActionRowBuilder<ButtonBuilder>,
  ): InteractionReplyOptions {
    return {
      ...payload,
      components: [...(payload.components ?? []), row],
    };
  }

  /**
   * Renders a multi-page (or single-action) Discord message driven by
   * navigation buttons attached to the interaction reply.
   *
   * **Pages** (`render` defined) — clicking the button fetches (or replays
   * cached) data and re-renders that page. The active page button is disabled
   * while on that page.
   *
   * **Action buttons** (`render` omitted) — clicking calls `fetch()` as a
   * side-effect then re-renders the current page with the existing payload and
   * an updated nav row.
   *
   * **Single-page shortcut** — when `pages` has exactly one entry with a
   * `render`, the message is sent without any buttons or collector.
   *
   * **Memory** — only one controller is kept alive per user. Opening a new
   * controller revokes the previous one and deletes its message.
   */
  async PageController(
    pages: PageEntry<unknown>[],
    options?: PageControllerOptions,
  ): Promise<void> {
    if (pages.length === 0) return;

    const idPrefix = options?.idPrefix ?? 'pgctrl';
    const timeout = options?.timeout ?? 180_000;

    // Single-page shortcut — no buttons needed.
    if (pages.length === 1) {
      const single = pages[0];
      if (single?.render) {
        const data = await single.fetch();
        await this.SendOrEdit(single.render(data));
      }
      return;
    }

    // Resolve initial page to the first render-capable entry.
    let currentIndex = options?.initialPage ?? 0;
    if (!pages[currentIndex]?.render) {
      const first = pages.findIndex((p) => p.render !== undefined);
      currentIndex = first === -1 ? 0 : first;
    }

    const cache = new Map<number, unknown>();
    const usedOnce = new Set<number>();
    let lastPagePayload: InteractionReplyOptions | null = null;

    /**
     * Unwraps a raw fetch result: if it is a `PageFetchResult`, the meta
     * overrides (`label`, `style`, `once`, `onceBehavior`) are applied to
     * `target` in-place and the inner `.data` is returned; otherwise the
     * value is returned as-is.
     */
    const unwrapFetch = (raw: unknown, target: PageEntry): unknown => {
      if (!isPageFetchResult(raw)) return raw;
      const { label, style, once, onceBehavior } = raw.meta;
      if (label !== undefined) target.label = label;
      if (style !== undefined) target.style = style;
      if (once !== undefined) target.once = once;
      if (onceBehavior !== undefined) target.onceBehavior = onceBehavior;
      return raw.data;
    };

    // Fetch and render the initial page.
    const initialEntry = pages[currentIndex];
    if (initialEntry?.render) {
      const raw = await initialEntry.fetch();
      const data = unwrapFetch(raw, initialEntry);
      if (initialEntry.cache !== false) cache.set(currentIndex, data);
      lastPagePayload = initialEntry.render(data);
    }

    // Revoke any existing controller for this user to free RAM.
    const userId = this.interaction.user.id;
    const existing = BaseInteraction.activeControllers.get(userId);
    if (existing) {
      existing.collector.stop('revoked');
      if (existing.message.deletable) await existing.message.delete();
    }

    const int = this.interaction;
    if (!int.isRepliable()) return;

    const initialRow = this.buildNavRow(pages, currentIndex, idPrefix, false, usedOnce);
    const initialPayload = lastPagePayload
      ? this.injectNavRow(lastPagePayload, initialRow)
      : { components: [initialRow] };

    await this.SendOrEdit(initialPayload);
    const message = await int.fetchReply();

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === userId && i.customId.startsWith(`${idPrefix}-`),
      time: timeout,
    });

    // Register as the single live controller for this user.
    BaseInteraction.activeControllers.set(userId, { collector, message });

    collector.on('collect', async (i) => {
      const clickedIndex = parseInt(i.customId.slice(idPrefix.length + 1), 10);
      if (isNaN(clickedIndex) || clickedIndex < 0 || clickedIndex >= pages.length) return;

      const page = pages[clickedIndex];
      if (!page) return;

      if (page.render) {
        // ── Page navigation button ──────────────────────────────────────────
        let data: unknown;
        if (page.cache !== false && cache.has(clickedIndex)) {
          data = cache.get(clickedIndex);
        } else {
          const raw = await page.fetch();
          data = unwrapFetch(raw, page);
          if (page.cache !== false) cache.set(clickedIndex, data);
        }
        currentIndex = clickedIndex;
        lastPagePayload = page.render(data as never);
        const row = this.buildNavRow(pages, currentIndex, idPrefix, false, usedOnce);
        await i.update(
          this.injectNavRow(lastPagePayload, row) as unknown as InteractionUpdateOptions,
        );
      } else {
        // ── Action / refresh button ─────────────────────────────────────────
        if (page.once && usedOnce.has(clickedIndex)) return;

        unwrapFetch(await page.fetch(), page);

        if (page.once) usedOnce.add(clickedIndex);

        const row = this.buildNavRow(pages, currentIndex, idPrefix, false, usedOnce);
        const payload =
          lastPagePayload !== null
            ? this.injectNavRow(lastPagePayload, row)
            : { components: [row] };
        await i.update(payload as unknown as InteractionUpdateOptions);
      }
    });

    collector.on('end', async (_, reason) => {
      // 'revoked' means a new controller already took over — nothing to clean up.
      if (reason === 'revoked') return;

      BaseInteraction.activeControllers.delete(userId);

      // Disable all nav buttons to signal the session has expired.
      const disabledRow = this.buildNavRow(pages, currentIndex, idPrefix, true, usedOnce);
      const expiredPayload = lastPagePayload
        ? this.injectNavRow(lastPagePayload, disabledRow)
        : { components: [disabledRow] };

      if (message.editable) await message.edit(expiredPayload as unknown as MessageEditOptions);
    });
  }
}

export default BaseInteraction;
