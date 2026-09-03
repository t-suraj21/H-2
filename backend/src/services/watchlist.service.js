import mongoose from 'mongoose';
import { Watchlist } from '../models/Watchlist.js';
import { Product } from '../models/Product.js';

export class WatchlistService {
  /**
   * Add a product to a user's watchlist with graceful duplicate handling
   * @param {string} userId
   * @param {object} params - { productId, targetPrice, notes, productData }
   * @returns {Promise<object>} Result with watchlist record and duplicate flag
   */
  async addToWatchlist(userId, { productId, targetPrice, notes = '', productData = {} }) {
    if (!userId) {
      throw new Error('User ID is required to add to watchlist');
    }

    let targetProduct = null;

    // 1. Resolve product by ObjectId or create if newly indexed
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      targetProduct = await Product.findById(productId);
    }

    if (!targetProduct) {
      // Check if product exists by name / brand
      const title = productData.title || productData.name || 'Watched Product';
      const brand = productData.brand || 'Generic';
      const model = productData.model || 'Standard Model';

      targetProduct = await Product.findOne({ name: title, brand });

      if (!targetProduct) {
        const basePrice = Number(productData.price || productData.currentPrice || 24999);
        const mrp = Number(productData.mrp || basePrice * 1.2);

        targetProduct = await Product.create({
          name: title,
          brand,
          model,
          category: productData.category || 'Electronics',
          image:
            productData.image ||
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
          lowestRecordedPrice: basePrice,
          highestRecordedPrice: mrp,
        });
      }
    }

    // 2. Check for duplicate entry
    const existing = await Watchlist.findOne({
      user: userId,
      product: targetProduct._id,
    });

    if (existing) {
      // Gracefully update targetPrice / notes without throwing duplicate error
      if (targetPrice !== undefined && targetPrice !== null) {
        existing.targetPrice = Number(targetPrice);
      }
      if (notes !== undefined) {
        existing.notes = notes;
      }

      await existing.save();
      await existing.populate('product');

      return {
        isDuplicate: true,
        message: 'Watchlist entry target price updated successfully',
        watchlist: existing,
      };
    }

    // 3. Create new watchlist item
    const initialPrice = targetProduct.lowestRecordedPrice || Number(productData.price || 0);

    const newEntry = await Watchlist.create({
      user: userId,
      product: targetProduct._id,
      targetPrice: targetPrice !== undefined && targetPrice !== null ? Number(targetPrice) : null,
      initialPrice,
      lowestPriceSinceAdded: initialPrice,
      notes,
    });

    await newEntry.populate('product');

    return {
      isDuplicate: false,
      message: 'Product added to watchlist successfully',
      watchlist: newEntry,
    };
  }

  /**
   * Get all watched products for a user
   * @param {string} userId
   * @returns {Promise<Array>} List of watchlist items
   */
  async getUserWatchlist(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const items = await Watchlist.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('product')
      .lean();

    return items.map((item) => {
      const p = item.product || {};
      const currentPrice = p.lowestRecordedPrice || item.initialPrice || 0;
      const lowestRecordedPrice = p.lowestRecordedPrice || item.lowestPriceSinceAdded || currentPrice;
      const highestRecordedPrice = p.highestRecordedPrice || currentPrice * 1.2;

      const isTargetReached =
        item.targetPrice !== null &&
        item.targetPrice > 0 &&
        currentPrice <= item.targetPrice;

      return {
        id: item._id,
        productId: p._id || item.product,
        title: p.name || 'Product',
        brand: p.brand || 'Brand',
        model: p.model || 'Model',
        category: p.category || 'General',
        image: p.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
        currentPrice,
        lowestRecordedPrice,
        highestRecordedPrice,
        initialPrice: item.initialPrice,
        targetPrice: item.targetPrice,
        isTargetReached,
        notes: item.notes,
        createdAt: item.createdAt,
      };
    });
  }

  /**
   * Remove a product from a user's watchlist
   * @param {string} userId
   * @param {string} idOrProductId - Watchlist document ID or Product ID
   * @returns {Promise<boolean>} True if removed
   */
  async removeFromWatchlist(userId, idOrProductId) {
    if (!userId || !idOrProductId) {
      throw new Error('User ID and item ID are required');
    }

    let deleted = null;

    if (mongoose.Types.ObjectId.isValid(idOrProductId)) {
      // Try deleting by Watchlist _id first
      deleted = await Watchlist.findOneAndDelete({
        _id: idOrProductId,
        user: userId,
      });

      // If not found, try deleting by product _id
      if (!deleted) {
        deleted = await Watchlist.findOneAndDelete({
          product: idOrProductId,
          user: userId,
        });
      }
    }

    return Boolean(deleted);
  }
}

export const watchlistService = new WatchlistService();
export default watchlistService;
