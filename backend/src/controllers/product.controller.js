import { urlAnalyzerService } from '../services/urlAnalyzer.service.js';
import { priceComparisonEngine } from '../services/comparison/PriceComparisonEngine.js';
import { priceHistoryService } from '../services/history/PriceHistoryService.js';
import { affiliateUrlService } from '../services/affiliate/AffiliateUrlService.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Analyze a product URL
 * POST /api/products/analyze
 */
export const analyzeProduct = async (req, res, next) => {
  try {
    const { url } = req.body;
    const analysis = await urlAnalyzerService.analyzeUrl(url);

    return sendSuccess(
      res,
      'Product URL analyzed successfully',
      analysis,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Compare product prices across multiple retailer offers
 * POST /api/products/compare
 */
export const compareProductPrices = async (req, res, next) => {
  try {
    const { product, offers, options } = req.body;

    if (!product) {
      return sendError(res, 'Product details are required for price comparison', 400);
    }

    if (!Array.isArray(offers) || offers.length === 0) {
      return sendError(res, 'At least one retailer offer is required for comparison', 400);
    }

    const userId = req.user?._id || req.user?.id || null;
    const trackingContext = { ...(options?.trackingContext || {}), userId };

    const comparisonResult = priceComparisonEngine.compare(product, offers, {
      ...(options || {}),
      trackingContext,
    });

    return sendSuccess(
      res,
      'Price comparison calculated successfully',
      comparisonResult,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get historical price observations and trend calculations
 * GET /api/products/:id/history
 */
export const getProductPriceHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { period, retailer } = req.query;

    if (!id) {
      return sendError(res, 'Product identifier is required', 400);
    }

    const historyData = await priceHistoryService.getPriceHistory(id, {
      period: period || '30D',
      retailerId: retailer,
    });

    return sendSuccess(
      res,
      'Price history retrieved successfully',
      historyData,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Generate authorized Buy Now destination / affiliate URL
 * POST /api/products/buy-now
 */
export const getBuyNowUrl = async (req, res, next) => {
  try {
    const { url, retailer, productId, offerId, campaign } = req.body;

    if (!url) {
      return sendError(res, 'Product URL is required to generate Buy Now destination', 400);
    }

    const userId = req.user?._id || req.user?.id || null;

    const result = affiliateUrlService.generateDestinationUrl(url, retailer, {
      userId,
      productId,
      offerId,
      campaign,
    });

    return sendSuccess(
      res,
      'Authorized Buy Now destination URL generated',
      result,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Search product across all supported shopping platforms
 * GET /api/products/search?q=query
 */
export const searchProduct = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || !q.trim()) {
      return sendError(res, 'Search query parameter (q) is required', 400);
    }
    const query = q.trim();
    const encoded = encodeURIComponent(query);
    const slugified = encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'));

    // Infer category
    let category = 'General';
    const lower = query.toLowerCase();
    if (lower.includes('iphone') || lower.includes('samsung') || lower.includes('phone') || lower.includes('mobile') || lower.includes('oneplus') || lower.includes('pixel') || lower.includes('redmi') || lower.includes('realme')) {
      category = 'Smartphones & Mobiles';
    } else if (lower.includes('macbook') || lower.includes('laptop') || lower.includes('dell') || lower.includes('hp') || lower.includes('asus') || lower.includes('lenovo') || lower.includes('tablet') || lower.includes('ipad')) {
      category = 'Laptops & Computers';
    } else if (lower.includes('headphone') || lower.includes('earphone') || lower.includes('earbuds') || lower.includes('airpods') || lower.includes('sony') || lower.includes('boat') || lower.includes('noise')) {
      category = 'Audio & Wearables';
    } else if (lower.includes('shirt') || lower.includes('tshirt') || lower.includes('jeans') || lower.includes('dress') || lower.includes('kurta') || lower.includes('saree') || lower.includes('shoes') || lower.includes('sneaker') || lower.includes('jacket')) {
      category = 'Fashion & Apparel';
    } else if (lower.includes('tv') || lower.includes('fridge') || lower.includes('refrigerator') || lower.includes('washing') || lower.includes('ac') || lower.includes('microwave')) {
      category = 'Appliances & Home';
    }

    const platforms = [
      {
        id: 'amazon',
        name: 'Amazon India',
        tagline: 'Best Prices & Prime Fast Delivery',
        searchUrl: `https://www.amazon.in/s?k=${encoded}`,
        color: '#FF9900',
        badge: 'Prime Deals',
        icon: 'local-mall',
        available: true,
        features: ['Pay on Delivery', 'Easy Returns', 'Prime Express Delivery'],
      },
      {
        id: 'flipkart',
        name: 'Flipkart',
        tagline: 'India\'s Favorite Marketplace',
        searchUrl: `https://www.flipkart.com/search?q=${encoded}`,
        color: '#2874F0',
        badge: 'Plus Assured',
        icon: 'storefront',
        available: true,
        features: ['SuperCoins Rewards', 'Brand Warranty', 'Assured Quality'],
      },
      {
        id: 'myntra',
        name: 'Myntra',
        tagline: 'Fashion, Lifestyle & Footwear',
        searchUrl: `https://www.myntra.com/${slugified}`,
        color: '#FF3F6C',
        badge: 'Insider Picks',
        icon: 'checkroom',
        available: true,
        features: ['100% Original Brands', '14-Day Exchanges', 'Trendsetters'],
      },
      {
        id: 'meesho',
        name: 'Meesho',
        tagline: 'Lowest Wholesale Prices & Everyday Deals',
        searchUrl: `https://www.meesho.com/search?q=${encoded}`,
        color: '#9B27B0',
        badge: 'Lowest Price',
        icon: 'shopping-bag',
        available: true,
        features: ['Zero Commission', 'Free Shipping', 'Factory Direct'],
      },
      {
        id: 'croma',
        name: 'Croma',
        tagline: 'Tata Verified Electronics & Tech',
        searchUrl: `https://www.croma.com/searchB?q=${encoded}%3Arelevance`,
        color: '#00A389',
        badge: 'Tata Assured',
        icon: 'devices',
        available: category !== 'Fashion & Apparel',
        features: ['Store Pickup', 'Extended Warranty', 'Official Brand Partner'],
      },
    ];

    return sendSuccess(
      res,
      `Found ${platforms.length} shopping platforms with "${query}"`,
      {
        query,
        category,
        totalPlatforms: platforms.length,
        platforms,
        timestamp: new Date().toISOString(),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

