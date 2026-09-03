import { ERROR_CODES } from './errorCodes.js';

/**
 * Base Application Error with standardized code and HTTP status
 */
export class AppError extends Error {
  /**
   * @param {string} code - Standardized error code from ERROR_CODES
   * @param {string} message - Human-readable error description
   * @param {number} [statusCode=500] - HTTP status code
   * @param {object} [details=null] - Optional sanitized metadata
   */
  constructor(code = ERROR_CODES.INTERNAL_SERVER_ERROR, message = 'Internal Server Error', statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request parameters', details = null) {
    super(ERROR_CODES.VALIDATION_ERROR, message, 400, details);
  }
}

export class InvalidUrlError extends AppError {
  constructor(message = 'Invalid product URL provided') {
    super(ERROR_CODES.INVALID_PRODUCT_URL, message, 400);
  }
}

export class UnsupportedRetailerError extends AppError {
  constructor(message = 'Unsupported retailer. HL² currently supports Amazon, Flipkart, and Croma.') {
    super(ERROR_CODES.UNSUPPORTED_RETAILER, message, 400);
  }
}

export class ProductNotFoundError extends AppError {
  constructor(message = 'We could not identify this product.') {
    super(ERROR_CODES.PRODUCT_NOT_FOUND, message, 404);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed. Please log in again.') {
    super(ERROR_CODES.AUTH_FAILURE, message, 401);
  }
}

export class ExpiredTokenError extends AppError {
  constructor(message = 'Authentication session has expired. Please log in again.') {
    super(ERROR_CODES.EXPIRED_JWT, message, 401);
  }
}

export class RetailerProviderError extends AppError {
  constructor(message = 'Retailer provider service is temporarily unavailable. Please try again later.') {
    super(ERROR_CODES.RETAILER_PROVIDER_FAILURE, message, 502);
  }
}

export class RequestTimeoutError extends AppError {
  constructor(message = 'Request timed out while contacting retailer provider.') {
    super(ERROR_CODES.REQUEST_TIMEOUT, message, 504);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please slow down and try again shortly.') {
    super(ERROR_CODES.RATE_LIMIT_EXCEEDED, message, 429);
  }
}
