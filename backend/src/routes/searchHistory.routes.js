import { Router } from 'express';
import {
  getRecentSearches,
  recordSearch,
  removeSearchItem,
  clearSearchHistory,
} from '../controllers/searchHistory.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All search history endpoints require authentication
router.use(authenticate);

/**
 * @route   GET /api/search-history
 * @desc    Get user recent searches
 * @access  Private
 */
router.get('/', getRecentSearches);

/**
 * @route   POST /api/search-history
 * @desc    Record or update analyzed product search item
 * @access  Private
 */
router.post('/', recordSearch);

/**
 * @route   DELETE /api/search-history/:id
 * @desc    Remove single search history item
 * @access  Private
 */
router.delete('/:id', removeSearchItem);

/**
 * @route   DELETE /api/search-history
 * @desc    Clear all search history for authenticated user
 * @access  Private
 */
router.delete('/', clearSearchHistory);

export default router;
