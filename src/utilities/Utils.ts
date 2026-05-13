import momentTimezone from 'moment-timezone';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Delays execution for a specified number of milliseconds.
 * @param ms - The number of milliseconds to sleep before the promise resolves.
 * @returns A promise that resolves after the specified delay.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resolves a relative file path to an absolute file URL, which can be used for dynamic imports.
 * @param relativePath - The relative path to the file from the current module.
 * @returns The absolute file URL as a string.
 */
export function resolveDynamicImportPath(relativePath: string): string {
  const withExt = path.extname(relativePath) ? relativePath : `${relativePath}.js`;
  const resolvedPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), withExt);
  return pathToFileURL(resolvedPath).href;
}

/**
 * Converts an absolute file path to a path relative to a specified base directory, optionally with a prefix.
 * @param fullPath - The absolute file path to convert.
 * @param baseDir - The base directory to which the path should be made relative.
 * @param appendPrefix - An optional prefix to prepend to the resulting relative path (e.g., for module namespaces).
 * @returns The relative path from the base directory to the full path, with the optional prefix if provided.
 */
export function getRelativePathFromDir(
  fullPath: string,
  baseDir: string,
  appendPrefix: string = '',
): string {
  let relative = path.relative(baseDir, fullPath);
  if (appendPrefix) relative = path.join(appendPrefix, relative);
  return relative;
}

/**
 * Recursively scans a directory for files up to a specified depth.
 * @param dir - Absolute path to the directory to scan.
 * @param depth - How many levels deep to scan. `1` means only the top level, `Infinity` for unlimited.
 * @returns A flat array of absolute file paths found within the depth limit.
 */
export function scanFiles(dir: string, depth: number = 1): string[] {
  if (depth < 1) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = scanFiles(fullPath, depth - 1);
      results.push(...nested);
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Truncates a string to a specified length and appends an ellipsis if it exceeds that length.
 * @param string - The string to truncate.
 * @param size - The maximum length of the string before truncation occurs.
 * @returns The truncated string with an ellipsis if it was too long, or the original string if it was within the limit.
 */
export function truncate(str: string, size: number): string {
  return str.length > size ? str.slice(0, size - 1) + '…' : str;
}

/**
 * Gets the timestamp for the start of the current day (00:00 AM) in a specified timezone.
 * @param timezone - The IANA timezone identifier (e.g., 'America/New_York') for which to calculate the start of the day.
 * @returns A Moment object representing the start of the day in the specified timezone, or null if the timezone is invalid.
 */
export function timestampStartOfTheDay(timezone: string) {
  const moment = momentTimezone;

  // Validate timezone
  if (!moment.tz.zone(timezone)) return null;

  // Get current date in the given timezone
  const now = moment().tz(timezone);

  // Get the start of the day (00:00 AM) in the given timezone
  const startOfDay = now.startOf('day');

  return startOfDay;
}

/**
 * Truncates the middle of a string, keeping a specified number of characters at the start and end, and replacing the removed middle section with a placeholder.
 * @param str - The string to truncate.
 * @param keepStart - The number of characters to keep at the start of the string.
 * @param keepEnd - The number of characters to keep at the end of the string.
 * @param placeholder - The string to insert in place of the truncated middle section (default is '***').
 * @returns The truncated string with the middle section replaced by the placeholder if the original string exceeds the combined length of the kept start and end characters, or the original string if it does not exceed that length.
 */
export function truncateMiddle(
  str: string,
  keepStart: number,
  keepEnd: number,
  placeholder = '***',
): string {
  if (str.length <= keepStart + keepEnd) return str;
  return str.slice(0, keepStart) + placeholder + str.slice(str.length - keepEnd);
}

/**
 * Parses a cookie string into an object where each key is a cookie name and each value is the corresponding cookie value.
 * @param cookie - The cookie string to parse, typically in the format "key1=value1; key2=value2; ...".
 * @returns An object representing the parsed cookies, where each key is a cookie name and each value is the corresponding cookie value. If the input string is not properly formatted, it may return an empty object or partial results based on the valid segments of the input.
 */
export function cookieParser(cookie: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pairs = cookie.split(';');
  for (const pair of pairs) {
    const [key, ...rest] = pair.trim().split('=');
    if (key && rest.length > 0) {
      result[key] = rest.join('=');
    }
  }
  return result;
}

/**
 * Converts an object representing cookies into a string format suitable for HTTP headers, where each key-value pair is joined by an equals sign and pairs are separated by semicolons.
 * @param cookieObj - An object where each key is a cookie name and each value is the corresponding cookie value.
 * @returns A string representing the cookies in the format "key1=value1; key2=value2; ...".
 */
export function cookieStringify(cookieObj: Record<string, string>): string {
  return Object.entries(cookieObj)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}
