# Changelog

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
