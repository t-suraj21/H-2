import mongoose from 'mongoose';
import { SearchHistory } from '../../models/SearchHistory.js';
import { logger } from '../../utils/logger.js';

export class SearchHistoryService {
  constructor(maxItemsPerUser = 50) {
    this.maxItemsPerUser = maxItemsPerUser;
  }

  /**
   * Clean product URL to strip volatile query tokens and keep canonical path
   * @param {string} rawUrl
   * @returns {string} Clean URL
   */
  cleanUrl(rawUrl = '') {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    try {
      const parsed = new URL(rawUrl);
      // Remove volatile session/tracking tokens
      const paramsToRemove = ['ref_', 'pf_rd_r', 'pf_rd_p', 'pd_rd_r', 'fbclid', 'gclid'];
      paramsToRemove.forEach((p) => parsed.searchParams.delete(p));
      return parsed.toString();
    } catch {
      return rawUrl.trim();
    }
  }

  /**
   * Record a recently analyzed product in search history
   * @param {string} userId
   * @param {object} searchData - { title, url, retailer, brand, category, lowestPrice, image, productId }
   * @returns {Promise<object>} Recorded or updated search document
   */
  async recordSearch(userId, searchData = {}) {
    if (!userId) {
      throw new Error('User ID is required to record search history');
    }

    const cleanUrl = this.cleanUrl(searchData.url);
    if (!cleanUrl) {
      throw new Error('Valid product URL is required to record search');
    }

    const title = searchData.title || searchData.name || 'Product Search';
    const retailer = searchData.retailer || 'Amazon';
    const brand = searchData.brand || 'Generic';
    const category = searchData.category || 'Electronics';
    const lowestPrice = Number(searchData.lowestPrice || searchData.price || 0);
    const image = searchData.image || null;
    const productId =
      searchData.productId && mongoose.Types.ObjectId.isValid(searchData.productId)
        ? searchData.productId
        : null;

    // 1. Upsert search entry (update timestamp and latest price if already searched)
    const filter = { user: userId, url: cleanUrl };
    const update = {
      $set: {
        title,
        retailer,
        brand,
        category,
        lowestPrice,
        image,
        product: productId,
        searchedAt: new Date(),
      },
    };

    const doc = await SearchHistory.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    // 2. Enforce bounded history limit (max 50 items per user)
    this.trimUserHistory(userId).catch((err) => {
      logger.warn(`[SearchHistoryService] Failed to trim history for user ${userId}: ${err.message}`);
    });

    return doc;
  }

  /**
   * Retrieve recent search history for a user
   * @param {string} userId
   * @param {number} [limit=20]
   * @returns {Promise<Array>} List of search items
   */
  async getRecentSearches(userId, limit = 20) {
    if (!userId) {
      throw new Error('User ID is required to retrieve search history');
    }

    const safeLimit = Math.min(Math.max(1, Number(limit) || 20), this.maxItemsPerUser);

    const items = await SearchHistory.find({ user: userId })
      .sort({ searchedAt: -1 })
      .limit(safeLimit)
      .lean();

    return items.map((item) => ({
      id: item._id,
      title: item.title,
      url: item.url,
      retailer: item.retailer,
      brand: item.brand,
      category: item.category,
      lowestPrice: item.lowestPrice,
      image: item.image,
      productId: item.product,
      searchedAt: item.searchedAt,
    }));
  }

  /**
   * Remove a specific search history item
   * @param {string} userId
   * @param {string} searchId
   * @returns {Promise<boolean>} True if deleted
   */
  async removeSearchItem(userId, searchId) {
    if (!userId || !searchId) {
      throw new Error('User ID and search ID are required');
    }

    const result = await SearchHistory.findOneAndDelete({
      _id: searchId,
      user: userId,
    });

    return Boolean(result);
  }

  /**
   * Clear all search history entries for a user
   * @param {string} userId
   * @returns {Promise<number>} Number of deleted items
   */
  async clearSearchHistory(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const result = await SearchHistory.deleteMany({ user: userId });
    return result.deletedCount || 0;
  }

  /**
   * Automatically trim oldest search records when exceeding maxItemsPerUser limit
   * @param {string} userId
   */
  async trimUserHistory(userId) {
    const count = await SearchHistory.countDocuments({ user: userId });
    if (count > this.maxItemsPerUser) {
      const itemsToKeep = await SearchHistory.find({ user: userId })
        .sort({ searchedAt: -1 })
        .limit(this.maxItemsPerUser)
        .select('_id')
        .lean();

      const idsToKeep = itemsToKeep.map((i) => i._id);

      await SearchHistory.deleteMany({
        user: userId,
        _id: { $nin: idsToKeep },
      });

      logger.info(
        `[SearchHistoryService] Trimmed ${count - this.maxItemsPerUser} excess search records for user ${userId}`
      );
    }
  }
}

export const searchHistoryService = new SearchHistoryService();
export default searchHistoryService;
