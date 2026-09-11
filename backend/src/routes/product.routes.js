import { Router } from 'express';
import {
  analyzeProduct,
  compareProductPrices,
  getProductPriceHistory,
  getBuyNowUrl,
  searchProduct,
} from '../controllers/product.controller.js';
import { analyzerLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * @route   GET /api/products/search
 * @desc    Search for any product and retrieve availability links across all shopping apps
 * @access  Public
 */
router.get('/search', searchProduct);

/**
 * @route   POST /api/products/analyze
 * @desc    Analyze product URL, extract identifier, normalize, and return product deal analysis
 * @access  Public (Rate limited)
 */
router.post('/analyze', analyzerLimiter, analyzeProduct);

/**
 * @route   POST /api/products/compare
 * @desc    Compare product offers across multiple retailers, calculating low/high/average & savings
 * @access  Public
 */
router.post('/compare', compareProductPrices);

/**
 * @route   GET /api/products/:id/history
 * @desc    Get historical price observations, range metrics, and 7D/30D/90D deltas
 * @access  Public
 */
router.get('/:id/history', getProductPriceHistory);

/**
 * @route   POST /api/products/buy-now
 * @desc    Generate authorized destination / affiliate URL for external retailer navigation
 * @access  Public
 */
router.post('/buy-now', getBuyNowUrl);

export default router;
