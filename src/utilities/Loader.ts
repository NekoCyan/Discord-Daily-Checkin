import { configDotenv } from 'dotenv';
configDotenv({
  quiet: true, // Suppress warnings about missing .env file
});

import { emitKeypressEvents } from 'node:readline';
import { fileURLToPath } from 'node:url';
import _logger from './logger.js';

// Determine the current file's name and set NODE_ENV based on the file extension
const __filename = fileURLToPath(import.meta.url);

// Try to set NODE_ENV based on the file extension
let tempNodeEnv;
if (__filename.endsWith('.ts')) tempNodeEnv = 'development';
else tempNodeEnv = 'production';

// If NODE_ENV is already set, keep it as is. Otherwise,
// set it to the value determined by the file extension.
process.env.NODE_ENV = process.env.NODE_ENV || tempNodeEnv;

/**
 * Loader is a top level component that is responsible for loading the application.
 * It is used to load the necessary resources and initialize the application on startup.
 */
export default function Loader() {
  global.logger = _logger(
    // Default log level is 'trace' in development and 'info' in production,
    // but can be overridden by LOG_LEVEL environment variable
    process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'trace' : 'info'),
  );

  global.isProduction = process.env.NODE_ENV === 'production';

  // Listen for keypress events to allow graceful shutdown on Ctrl+C
  // This will helpful for cmd users on windows 10 I guess :>
  emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.on('keypress', (str, key) => {
    // ctrl + c keys.
    if (key && key.sequence === '\x03') {
      logger.info(str);
      process.exit(1);
    }
  });
}
