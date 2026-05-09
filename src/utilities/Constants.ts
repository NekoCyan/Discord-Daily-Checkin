import { QualifiedBatchCheckInOptions } from '../../types/index.js';

export const BatchDefaultOptions: QualifiedBatchCheckInOptions = {
  batchSize: 10,
  delayPerBatchMs: 0,
  concurrency: 1,
};

export const UserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6938.90 Safari/537.36';
export const FullBrandVersion = '99.0.0.0';
export const BrowserVersion = '134';

/**
 * Default headers to be used in the requests. This can be extended or overridden as needed.
 */
export const _DefaultHeaders = {
  'accept-encoding': 'gzip, deflate, br, zstd',
  'accept-language': 'en-US,en;q=0.9',
  priority: 'u=1, i',
  'sec-ch-ua': `"(Not(A:Brand";v="${FullBrandVersion.split('.')[0]}", "Google Chrome";v="${BrowserVersion}", "Chromium";v="${BrowserVersion}"`,
  'sec-ch-ua-full-version-list': `"(Not(A:Brand";v="${FullBrandVersion}", "Google Chrome";v="${BrowserVersion}", "Chromium";v="${BrowserVersion}"`,
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'user-agent': UserAgent,
};
