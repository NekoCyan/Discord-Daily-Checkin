import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Resolves a relative file path to an absolute file URL, which can be used for dynamic imports.
 * @param relativePath - The relative path to the file from the current module.
 * @returns The absolute file URL as a string.
 */
export function resolveDynamicImportPath(relativePath: string): string {
  const resolvedPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), relativePath);
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
