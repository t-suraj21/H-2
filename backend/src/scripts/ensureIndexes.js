import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { PriceHistory } from '../models/PriceHistory.js';
import { PriceAlert } from '../models/PriceAlert.js';
import { Watchlist } from '../models/Watchlist.js';
import { SearchHistory } from '../models/SearchHistory.js';
import { NotificationLog } from '../models/NotificationLog.js';

/**
 * Production Database Index Synchronizer
 * Ensures all compound, unique, and TTL indexes are built cleanly
 */
export const ensureIndexes = async () => {
  try {
    logger.info('[IndexSync] Connecting to database...');
    await connectDatabase();

    const models = [
      { name: 'User', model: User },
      { name: 'Product', model: Product },
      { name: 'PriceHistory', model: PriceHistory },
      { name: 'PriceAlert', model: PriceAlert },
      { name: 'Watchlist', model: Watchlist },
      { name: 'SearchHistory', model: SearchHistory },
      { name: 'NotificationLog', model: NotificationLog },
    ];

    logger.info('[IndexSync] Synchronizing indexes across collections...');

    for (const { name, model } of models) {
      await model.createIndexes();
      const currentIndexes = await model.collection.indexes();
      logger.info(`[IndexSync] Synchronized ${currentIndexes.length} indexes on collection: ${name}`);
    }

    logger.info('[IndexSync] ✅ All production indexes synchronized successfully!');
  } catch (error) {
    logger.error(`[IndexSync] ❌ Failed to synchronize database indexes: ${error.message}`);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

// Run if called directly from CLI
if (process.argv[1] && process.argv[1].endsWith('ensureIndexes.js')) {
  ensureIndexes().then(() => process.exit(0));
}

export default ensureIndexes;
