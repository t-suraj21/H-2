/**
 * NoSQL Injection Protection Middleware
 * Recursively sanitizes request objects to remove prohibited MongoDB query operators ($ and .)
 */

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    // Prohibit keys starting with $ (Mongo operators) or containing . (dot notation traversal)
    if (!key.startsWith('$') && !key.includes('.')) {
      clean[key] = sanitizeObject(value);
    }
  }

  return clean;
};

export const sanitizeInputs = (req, _res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

export default sanitizeInputs;
