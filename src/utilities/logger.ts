import { performance } from 'perf_hooks';
import pino from 'pino';

// ─── Types ────────────────────────────────────────────────────────────────────

type PinoLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Extends pino's LogFn to accept an optional tracking key as the last argument.
 *
 * logger.info('msg')                   → normal log
 * logger.info('msg', 'key')            → tracked log with key
 * logger.info({ ...obj }, 'msg')       → normal log with object
 * logger.info({ ...obj }, 'msg', 'key')→ tracked log with object + key
 */
interface TrackedLogFn {
  (msg: string, key?: string): void;
  (obj: object, msg?: string, key?: string): void;
}

/**
 * Replaces all level methods on pino.Logger with TrackedLogFn,
 * while preserving every other pino property/method as-is.
 */
type TrackedLogger = Omit<pino.Logger, PinoLevel> & {
  [L in PinoLevel]: TrackedLogFn;
};

// ─── Implementation ───────────────────────────────────────────────────────────

const LEVELS: readonly PinoLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

const _logger = (logLevel: pino.LevelWithSilentOrString): TrackedLogger => {
  // Map to store start times for tracking keys
  const timerMap = new Map<string, number>();
  const currentLevelIndex = LEVELS.indexOf(logLevel as PinoLevel);

  const base = pino({
    level: logLevel,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  });

  // Helper function to calculate time difference for a given key and return a formatted suffix
  const getDiffSuffix = (key?: string): string => {
    // Only track for 'trace' and 'debug' levels
    if (currentLevelIndex >= LEVELS.indexOf('info')) return '';

    if (!key) return '';

    const now = performance.now();
    const startTime = timerMap.get(key);

    if (startTime === undefined) {
      timerMap.set(key, now);
      return ` \u001b[90m[${key}] +0ms\u001b[39m`;
      // return ` \u001b[90m+0ms\u001b[39m`;
    }

    const diff = (now - startTime).toFixed(2);
    timerMap.delete(key);
    return ` \u001b[90m[${key}] +${diff}ms\u001b[39m`;
    // return ` \u001b[90m+${diff}ms\u001b[39m`;
  };

  // Create a Proxy to wrap the base logger and intercept calls to level methods
  return new Proxy(base, {
    get(target, prop: string) {
      if ((LEVELS as readonly string[]).includes(prop)) {
        const fn: TrackedLogFn = (msgOrObj: string | object, msgOrKey?: string, key?: string) => {
          if (typeof msgOrObj === 'string') {
            const suffix = getDiffSuffix(msgOrKey);
            target[prop as PinoLevel](msgOrObj + suffix);
          } else {
            const suffix = getDiffSuffix(key);
            target[prop as PinoLevel](msgOrObj, (msgOrKey ?? '') + suffix);
          }
        };
        return fn;
      }

      return target[prop as keyof typeof target];
    },
  }) as unknown as TrackedLogger;
};

export type { PinoLevel, TrackedLogFn, TrackedLogger };
export default _logger;
