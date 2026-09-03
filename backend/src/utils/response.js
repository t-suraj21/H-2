/**
 * Standardized API response formatters for HL²
 */

export const sendSuccess = (res, message, data, statusCode = 200) => {
  const responseBody = {
    success: true,
    message,
    ...(data !== undefined && { data }),
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(responseBody);
};

export const sendError = (res, message, statusCode = 500, codeOrDetails = 'INTERNAL_SERVER_ERROR', extraDetails = null) => {
  let code = 'INTERNAL_SERVER_ERROR';
  let cleanMessage = typeof message === 'string' ? message : 'An error occurred';

  if (typeof codeOrDetails === 'string') {
    code = codeOrDetails;
  } else if (codeOrDetails && typeof codeOrDetails === 'object') {
    code = codeOrDetails.code || 'INTERNAL_SERVER_ERROR';
    if (codeOrDetails.message) cleanMessage = codeOrDetails.message;
  }

  // Status code mappings if default
  if (code === 'INTERNAL_SERVER_ERROR') {
    if (statusCode === 400) code = 'VALIDATION_ERROR';
    else if (statusCode === 401) code = 'AUTH_FAILURE';
    else if (statusCode === 403) code = 'FORBIDDEN';
    else if (statusCode === 404) code = 'NOT_FOUND';
    else if (statusCode === 409) code = 'DUPLICATE_RESOURCE';
    else if (statusCode === 429) code = 'RATE_LIMIT_EXCEEDED';
    else if (statusCode === 502) code = 'RETAILER_PROVIDER_FAILURE';
    else if (statusCode === 504) code = 'REQUEST_TIMEOUT';
  }

  const responseBody = {
    success: false,
    message: cleanMessage,
    error: {
      code,
      message: cleanMessage,
      ...(extraDetails && { details: extraDetails }),
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(responseBody);
};
