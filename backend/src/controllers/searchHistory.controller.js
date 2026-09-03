import { searchHistoryService } from '../services/history/SearchHistoryService.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Get recent product searches for authenticated user
 * GET /api/search-history
 */
export const getRecentSearches = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { limit = 20 } = req.query;

    const searches = await searchHistoryService.getRecentSearches(userId, limit);

    return sendSuccess(
      res,
      'Recent searches retrieved successfully',
      searches,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Record an analyzed product search item
 * POST /api/search-history
 */
export const recordSearch = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { title, url, retailer, brand, category, lowestPrice, image, productId } = req.body;

    if (!url) {
      return sendError(res, 'Product URL is required to record search history', 400);
    }

    const recorded = await searchHistoryService.recordSearch(userId, {
      title,
      url,
      retailer,
      brand,
      category,
      lowestPrice,
      image,
      productId,
    });

    return sendSuccess(
      res,
      'Search history recorded successfully',
      recorded,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an individual search history item
 * DELETE /api/search-history/:id
 */
export const removeSearchItem = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!id) {
      return sendError(res, 'Search history item ID is required', 400);
    }

    const removed = await searchHistoryService.removeSearchItem(userId, id);

    if (!removed) {
      return sendError(res, 'Search history item not found or already removed', 404);
    }

    return sendSuccess(
      res,
      'Search history item removed successfully',
      { id, removed: true },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Clear all search history for authenticated user
 * DELETE /api/search-history
 */
export const clearSearchHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const deletedCount = await searchHistoryService.clearSearchHistory(userId);

    return sendSuccess(
      res,
      'Search history cleared successfully',
      { deletedCount, cleared: true },
      200
    );
  } catch (error) {
    next(error);
  }
};
