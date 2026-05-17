# Changelog

## [1.1.0] - 2026-05-17

### Features

- **HoYoLAB platform support** — Added full support for HoYoverse Games daily check-ins (**Zenless Zone Zero**, **Honkai: Star Rail**, **Genshin Impact**, **Honkai Impact 3rd**) via a new `/hoyolab` slash command group and `Hoyolab Profile` user context menu.
- **`/hoyolab` slash command group** — New command group with subcommands: `profile`, `check-in`, `set-cookie` (Method 1 — full cookie string), `set-cookie-2` (Method 2 — `ltoken_v2` + `ltuid_v2` fields), `delete-cookie`, `setup-wizard`, and `set-visibility`.
- **`Hoyolab Profile` user context menu** — Right-click any user to view their Hoyoverse Games check-in profile directly; equivalent to `/hoyolab profile target:<user>`.
- **`HoyolabService`** — New service class providing daily check-in helpers, game info mapping, and `setLanguage` / `setGameIdsToDailyCheck` methods. Includes typed responses for all supported games (`HSRCheckInResponse`, `HI3CheckInResponse`, etc.). Renamed `isValidAccount` to `isValidCookie`.
- **`HoyolabModel`** — New Mongoose model and TypeScript interfaces for persisting Hoyoverse account data, including `lang` field, `isAccountSetted`, and `isGameIdsSetted` helpers. Added `getBatchUncheckedDaily` with correct query conditions.
- **Hoyolab batch check-in runner** — Scheduler-integrated runner for processing Hoyoverse accounts in batches; mirrors the existing Endfield batch runner. Auto daily messages are suppressed when the account has no games configured for check-in.
- **Hoyolab setup wizard** — Interactive wizard guiding users through language preference and game selection for daily check-in, with a language select placed above game select and contextual notes.
- **Cookie validation on set** — `/hoyolab set-cookie` and `set-cookie-2` now verify that the account has at least one game linked before saving the cookie. Input length limits raised to accommodate longer cookie values.
- **`/endfield delete-account-token` subcommand** — New subcommand to explicitly remove a linked Endfield account token from your Discord account (previously only possible by passing `reset` to `set-account-token`).
- **Select menu handler & types** — Added a dedicated select menu interaction handler and corresponding TypeScript types to support wizard and setup flows.
- **`followUp` helper** — New `followUp` utility for sending a separate follow-up message from within a helper function; integrated into Endfield flows.
- **Centralized batch check-in options logging** — Batch processing configuration (`BATCH_SIZE`, `DELAY_PER_BATCH_MS`, `CONCURRENCY`) is now logged once at startup from a shared location instead of per-service.

### Refactors

- **Hoyolab reward display & user section** — Redesigned the Hoyoverse profile page layout with dedicated reward and user sections consistent with the Endfield profile style.
- **Today/tomorrow reward helper sections for Endfield** — Extracted today/tomorrow reward display into reusable helper sections within the Endfield profile page.
- **Hoyolab/Endfield importing and scheduler** — Consolidated service imports and unified the scheduler registration for both platforms.
- **Renamed `checkin` subcommand to `check-in`** — Standardized the subcommand name across both `/endfield` and `/hoyolab` for consistency.
- **Renamed `endfieldProfile.ts` to `EndfieldProfile.ts`** — File renamed to match PascalCase convention used across the codebase.
- **`RunBatchCheckIn` logging** — Endfield batch check-in now uses a `msg()` wrapper for consistent log formatting.

### Fixes

- **`HoyolabModel.getBatchUncheckedDaily`** — Missing query conditions caused incorrect account selection for batch check-in; query now correctly filters by check-in state and game configuration.
- **Select menu interaction not handled** — Interactions originating from select menus were not being routed to their handler; the missing dispatch case has been added.

### Docs

- **`COMMANDS.md`** — Added full documentation for `/hoyolab` (all subcommands with option tables) and the `Hoyolab Profile` user context menu.
- **`README.md`** — Updated bot description to list all supported games and platforms. Added **Retrieving Your Hoyolab Account Cookie** guide with step-by-step browser DevTools instructions and screenshots.

---

## [1.0.3] - 2026-05-10

### Features

- **Real-time Endfield API** — Added `getRealTimeData()` and `getRealTimeDataDetail()` methods to `EndfieldService`, along with new TypeScript interfaces for all real-time response shapes and shared types (`CurrentTotal`, `KeyValue`, `CountTotal`).
- **PageController for interactive paged messages** — Implemented a `PageController` system in `BaseInteraction` supporting navigation rows, per-user controller lifecycle, caching, single-page shortcuts, and action buttons with `once`/`onceBehavior` handling. Includes typed helpers (`definePage`, `pageResult`, `isPageFetchResult`) and new types (`PageEntry`, `PageMeta`, `PageFetchResult`, `PageControllerOptions`).
- **`followUp` and `refreshRender` support in PageController** — Pages can now return a `followUp` meta to send a separate follow-up message alongside the navigation update (required for components-v2 pages). Added `refreshRender` option to re-render the current page after an action.
- **Increased PageController default timeout to 5 minutes** — Default collector lifetime raised from 3 min (`180_000 ms`) to 5 min (`300_000 ms`) to reduce premature timeouts.
- **`EndfieldService` constructor now requires options** — `accountToken` and `cred` are now assigned directly at construction. Added `origin` and `referer` default headers pointing to `https://game.skport.com`.
- **Instance-level `Constants` in `EndfieldService`** — Replaced `EndfieldService.Constants` (static reference) with `this.Constants` for timestamp calculations and header construction, enabling correct instance-level behavior.

### Refactors

- **Generic UI helper** — Introduced `src/helper/_helper.ts` providing reusable `TextDisplay` and `Separator` utilities shared across features.
- **Endfield UI helpers and paged profile** — Replaced `EndfieldUserSection` with `EndfieldSkportUserSection`, added ingame sections (`EndfieldIngameUserSection`, `EndfieldIngameBaseSection`, `EndfieldIngameRealTimeResourcesSection`). `Profile` is now a paged UI with a real-time info page and a check-in page. `SetVisibility` now accepts `ContextMenuInteraction` and handles components-v2 follow-ups.
- **`ContainerBuilder` in Endfield helpers** — Endfield helper functions now accept a `ContainerBuilder` and add components directly to it, removing builder returns and simplifying call sites in `DoCheckIn` and `Profile`. Added `EndfieldProfilePrivateNotice` to encapsulate the private-profile section and toggle button.

### Fixes

- **CI/CD: mismatched env file for mongo service** — `docker-compose.mongo.yml` was referencing `.env` instead of `.env.production`, causing compose validation to fail in CI.

---

## [1.0.2] - 2026-05-09

### Features

- **Configurable batch check-in options via environment variables** — `BATCH_SIZE`, `DELAY_PER_BATCH_MS`, and `CONCURRENCY` can now be set through environment variables. Defaults are `10`, `0`, and `1` respectively. `BotClient` validates these options on startup and enforces positive/non-negative constraints.
- **Centralized default HTTP headers** — Introduced `UserAgent`, brand/version fields, and `_DefaultHeaders` in `Constants.ts`. `EndfieldService` now merges these defaults into every outgoing request for consistent request metadata.
- **Service scheduler extracted to its own module** — The cron-based Endfield batch check-in logic has been moved out of `clientReady` into a new `utilities/ServiceScheduler.ts`. `runServiceScheduler(client)` sets up the midnight/noon cron jobs, guards against duplicate starts, and performs an initial manual run on startup.
- **Added `checks` script** — `package.json` now includes a `checks` script that runs `format-check`, `lint`, and `type-check` in sequence.

### Fixes

- **Type safety for `batchCheckInOptions`** — `BotClient` now correctly returns `QualifiedBatchCheckInOptions` (all fields defined) by casting after merging defaults with the user-supplied partial options.
- **`LOG_LEVEL` default in `.env.example`** — The example env file now includes an explicit value for `LOG_LEVEL`.

### Docs

- Added `BATCH_SIZE`, `DELAY_PER_BATCH_MS`, and `CONCURRENCY` environment variable entries to `README.md` and `Docker_PreBuilt.md`.
- Added stub `.env.production` for CI validation.

---

## [1.0.1] - 2026-05-07

See the [1.0.1 release](https://github.com/NekoCyan/Discord-Daily-Checkin/releases/tag/1.0.1) for details.

## [1.0.0] - 2026-05-07

See the [1.0.0 release](https://github.com/NekoCyan/Discord-Daily-Checkin/releases/tag/1.0.0) for details.
