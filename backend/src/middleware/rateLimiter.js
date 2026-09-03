import { sendError } from '../utils/response.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

/**
 * In-memory Token Bucket Rate Limiter
 * Tracks client IP requests across sliding windows
 */
export const createRateLimiter = ({
  windowMs = 60 * 1000,
  maxRequests = 60,
  message = 'Too many requests. Please slow down and try again shortly.',
} = {}) => {
  const hits = new Map();

  // Periodic cleanup of expired window buckets every 2 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits.entries()) {
      if (now - entry.startTime > windowMs) {
        hits.delete(ip);
      }
    }
  }, 2 * 60 * 1000);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    // In automated testing environments, allow high throughput
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-ratelimit']) {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let entry = hits.get(ip);

    if (!entry || now - entry.startTime > windowMs) {
      entry = { count: 1, startTime: now };
      hits.set(ip, entry);
    } else {
      entry.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', new Date(entry.startTime + windowMs).toISOString());

    if (entry.count > maxRequests) {
      return sendError(
        res,
        message,
        429,
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        { retryAfterMs: Math.max(0, entry.startTime + windowMs - now) }
      );
    }

    next();
  };
};

// Global API Limiter: 300 requests / 15 mins
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 300,
  message: 'API rate limit exceeded. Please try again later.',
});

// Auth Limiter: 30 requests / 15 mins to prevent brute-force attacks
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 30,
  message: 'Too many authentication attempts. Please wait 15 minutes before retrying.',
});

// Product Analyzer Limiter: 60 requests / minute to prevent upstream scrap spamming
export const analyzerLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: 'Product scan rate limit reached. Please wait a minute before analyzing more URLs.',
});
