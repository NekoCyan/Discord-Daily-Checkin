// This file is used to export the entry path of the application,
// which can be used in other parts of the codebase to reference
// the root directory.

import { dirname } from 'node:path';

/**
 * The path that starts with disk drive (e.g., C:\) and leads
 * to the root directory of the application.
 */
export const entryPath = import.meta.dirname;
/**
 * The path that starts with "file://" and leads to the root directory of the application.
 * This is useful for dynamic imports and other file system operations that require a URL format.
 */
export const entryPathUrl = dirname(import.meta.url);
