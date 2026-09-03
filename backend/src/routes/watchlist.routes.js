import { Router } from 'express';
import {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
} from '../controllers/watchlist.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All watchlist endpoints require authentication
router.use(authenticate);

/**
 * @route   POST /api/watchlist
 * @desc    Add product to user watchlist or update target price
 * @access  Private
 */
router.post('/', addToWatchlist);

/**
 * @route   GET /api/watchlist
 * @desc    Get all watched products for current user
 * @access  Private
 */
router.get('/', getWatchlist);

/**
 * @route   DELETE /api/watchlist/:id
 * @desc    Remove product from user watchlist
 * @access  Private
 */
router.delete('/:id', removeFromWatchlist);

export default router;
