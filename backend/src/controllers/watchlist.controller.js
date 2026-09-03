import { watchlistService } from '../services/watchlist.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Add a product to the user's watchlist
 * POST /api/watchlist
 */
export const addToWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId, targetPrice, notes, productData } = req.body;

    const result = await watchlistService.addToWatchlist(userId, {
      productId,
      targetPrice,
      notes,
      productData,
    });

    const statusCode = result.isDuplicate ? 200 : 201;

    return sendSuccess(
      res,
      result.message,
      result.watchlist,
      statusCode
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all watched products for current user
 * GET /api/watchlist
 */
export const getWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const items = await watchlistService.getUserWatchlist(userId);

    return sendSuccess(
      res,
      'Watchlist retrieved successfully',
      items,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a product from the user's watchlist
 * DELETE /api/watchlist/:id
 */
export const removeFromWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!id) {
      return sendError(res, 'Watchlist item ID is required', 400);
    }

    const removed = await watchlistService.removeFromWatchlist(userId, id);

    if (!removed) {
      return sendError(res, 'Item not found in your watchlist', 404);
    }

    return sendSuccess(
      res,
      'Product removed from watchlist',
      { id, removed: true },
      200
    );
  } catch (error) {
    next(error);
  }
};
