import { startPriceCheckWorker, stopPriceCheckWorker } from './priceCheck.worker.js';
import { logger } from '../utils/logger.js';

export const startAllWorkers = () => {
  try {
    const worker = startPriceCheckWorker();
    logger.info('HL² Background workers started successfully');
    return { priceCheckWorker: worker };
  } catch (err) {
    logger.warn(`Could not initialize background workers: ${err.message}`);
    return {};
  }
};

export const stopAllWorkers = async () => {
  await stopPriceCheckWorker();
};

export {
  startPriceCheckWorker,
  stopPriceCheckWorker,
  processPriceCheckJob,
} from './priceCheck.worker.js';
