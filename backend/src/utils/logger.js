const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'auth',
  'secret',
  'jwt',
  'apikey',
  'api_key',
  'accesstoken',
  'refreshtoken',
  'creditcard',
]);

const maskSensitiveData = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(maskSensitiveData);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = maskSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

class Logger {
  formatMessage(level, message, meta) {
    const timestamp = new Date().toISOString();
    const prefix = `[HL² Backend] [${timestamp}] [${level.toUpperCase()}]`;
    if (meta) {
      const sanitizedMeta = typeof meta === 'object' ? maskSensitiveData(meta) : meta;
      return `${prefix} ${message} ${typeof sanitizedMeta === 'object' ? JSON.stringify(sanitizedMeta) : sanitizedMeta}`;
    }
    return `${prefix} ${message}`;
  }

  info(message, meta) {
    console.log(this.formatMessage('info', message, meta));
  }

  warn(message, meta) {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message, meta) {
    console.error(this.formatMessage('error', message, meta));
  }

  debug(message, meta) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}

export const logger = new Logger();
