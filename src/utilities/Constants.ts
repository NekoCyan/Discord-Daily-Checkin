import { BatchCheckInOptions } from '../../types/index.js';

export const BatchDefaultOptions: Required<BatchCheckInOptions> = {
  batchSize: 10,
  delayPerBatchMs: 0,
  concurrency: 1,
};
