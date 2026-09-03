import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message = err.message || 'An unexpected error occurred. Please try again later.';
  let details = err.details || null;

  // 1. Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An entry with this ${field} already exists. Please choose another ${field}.`;
  }

  // 2. Handle Mongoose Validation Error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join('. ');
  }

  // 3. Handle Mongoose Bad ObjectId (CastError)
  else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = `Invalid format for resource identifier.`;
  }

  // 4. Handle JWT Token Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = ERROR_CODES.AUTH_FAILURE;
    message = 'Invalid authentication token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = ERROR_CODES.EXPIRED_JWT;
    message = 'Your session has expired. Please log in again.';
  }

  // 5. Handle Network & Fetch Timeouts
  else if (
    err.code === 'ECONNABORTED' ||
    err.code === 'ETIMEDOUT' ||
    err.name === 'TimeoutError' ||
    err.message?.toLowerCase().includes('timeout')
  ) {
    statusCode = 504;
    errorCode = ERROR_CODES.REQUEST_TIMEOUT;
    message = 'The request timed out while contacting upstream services. Please retry.';
  }

  // 6. Handle Upstream Provider Connection Failures
  else if (
    err.code === 'ECONNREFUSED' ||
    err.code === 'ENOTFOUND' ||
    err.message?.toLowerCase().includes('fetch failed')
  ) {
    statusCode = 502;
    errorCode = ERROR_CODES.NETWORK_FAILURE;
    message = 'External retailer service is temporarily unreachable.';
  }

  // 7. Handle MongoDB Disconnection / Outages
  else if (
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError' ||
    err.message?.toLowerCase().includes('topology was destroyed')
  ) {
    statusCode = 503;
    errorCode = ERROR_CODES.DATABASE_ERROR;
    message = 'Database service is temporarily unavailable. Please try again shortly.';
  }

  // Internal logging with full stack trace for observability
  logger.error(`[ErrorHandler] [${req.method}] ${req.originalUrl} - ${errorCode} (${statusCode}): ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  // Never expose raw stack traces, database strings, or internal implementation details
  return sendError(res, message, statusCode, errorCode, details);
};

export default errorHandler;
