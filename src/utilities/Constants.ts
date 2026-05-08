import { QualifiedBatchCheckInOptions } from '../../types/index.js';

export const BatchDefaultOptions: QualifiedBatchCheckInOptions = {
  batchSize: 10,
  delayPerBatchMs: 0,
  concurrency: 1,
};
