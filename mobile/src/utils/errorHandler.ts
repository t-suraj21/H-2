/**
 * Mobile Client Error Translator for HL²
 * Converts technical backend error codes and network failures into user-friendly messages
 */

export interface AppErrorPayload {
  code?: string;
  message?: string;
  details?: any;
}

export const ERROR_CODE_TRANSLATIONS: Record<string, { title: string; message: string; actionText?: string }> = {
  NETWORK_FAILURE: {
    title: 'Connection Issue',
    message: 'Unable to connect to the internet. Please check your network connection and try again.',
    actionText: 'Retry',
  },
  REQUEST_TIMEOUT: {
    title: 'Request Timed Out',
    message: 'The store took too long to respond. Please verify your connection or try again shortly.',
    actionText: 'Retry',
  },
  RETAILER_PROVIDER_FAILURE: {
    title: 'Store Temporarily Busy',
    message: 'The merchant website is currently experiencing high traffic. Please try again in a few moments.',
    actionText: 'Retry',
  },
  UNSUPPORTED_RETAILER: {
    title: 'Unsupported Retailer',
    message: 'HL² currently compares products from Amazon, Flipkart, and Croma. More stores are coming soon!',
  },
  INVALID_PRODUCT_URL: {
    title: 'Invalid Link',
    message: 'Please paste a direct product link starting with https:// (e.g., https://amazon.in/dp/...)',
  },
  PRODUCT_NOT_FOUND: {
    title: 'Product Not Identified',
    message: 'We could not detect a product code in this link. Please ensure you copied a direct product page.',
  },
  AMBIGUOUS_PRODUCT_MATCH: {
    title: 'Multiple Matches Found',
    message: 'We found multiple variants for this item. Please select your preferred color or storage option.',
  },
  STALE_PRICE: {
    title: 'Price Updating',
    message: 'This price was recorded earlier and is being refreshed live by our scanners.',
  },
  UNAVAILABLE_PRODUCT: {
    title: 'Out of Stock',
    message: 'This product is currently out of stock or unavailable at the selected retailer.',
  },
  AUTH_FAILURE: {
    title: 'Sign In Required',
    message: 'Your session is invalid or you are not signed in. Please log in to continue.',
    actionText: 'Sign In',
  },
  EXPIRED_JWT: {
    title: 'Session Expired',
    message: 'Your security session has expired. Please sign in again to continue.',
    actionText: 'Sign In',
  },
  DATABASE_ERROR: {
    title: 'Service Maintenance',
    message: 'Our service is undergoing brief maintenance. Please try again in a moment.',
    actionText: 'Retry',
  },
  RATE_LIMIT_EXCEEDED: {
    title: 'Too Many Requests',
    message: 'You have made several requests quickly. Please wait a few seconds before trying again.',
  },
  BACKGROUND_JOB_FAILURE: {
    title: 'Update Delayed',
    message: 'Background price checking is delayed. Your price will update on the next cycle.',
  },
  VALIDATION_ERROR: {
    title: 'Invalid Input',
    message: 'Please check the information you entered and try again.',
  },
  INTERNAL_SERVER_ERROR: {
    title: 'Unexpected Error',
    message: 'Something went wrong while processing your request. Please try again.',
    actionText: 'Retry',
  },
};

/**
 * Format any raw error into a user-friendly title and message
 * @param {any} error - Backend error payload, string, or Error instance
 * @returns {{ title: string, message: string, actionText?: string }}
 */
export const getFriendlyErrorMessage = (
  error: any
): { title: string; message: string; actionText?: string } => {
  if (!error) {
    return {
      title: 'Unexpected Error',
      message: 'An unknown error occurred. Please try again.',
    };
  }

  // If backend returned structured error object
  const errorCode =
    typeof error === 'object' && error?.error?.code
      ? error.error.code
      : typeof error?.code === 'string'
      ? error.code
      : null;

  if (errorCode && ERROR_CODE_TRANSLATIONS[errorCode]) {
    return ERROR_CODE_TRANSLATIONS[errorCode];
  }

  // Fallback to message string or standard error
  const rawMsg =
    typeof error === 'string'
      ? error
      : error?.error?.message || error?.message || 'An error occurred. Please try again.';

  return {
    title: 'Notice',
    message: rawMsg,
  };
};

export default getFriendlyErrorMessage;
