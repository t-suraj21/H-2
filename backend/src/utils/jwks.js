import jwksRsa from 'jwks-rsa';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

let client = null;

/**
 * Get or initialize the JWKS client for Auth0
 */
export const getJwksClient = () => {
  if (!client) {
    const domain = config.AUTH0_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '');
    client = jwksRsa({
      cache: true,
      cacheMaxEntries: 10,
      cacheMaxAge: 600000, // 10 minutes
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      jwksUri: `https://${domain}/.well-known/jwks.json`,
      timeout: 10000, // 10s timeout
    });
  }
  return client;
};

/**
 * Retrieve the signing public key for a given token header (kid)
 */
export const getSigningKey = (header, callback) => {
  const jwks = getJwksClient();
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err, null);
    }
    const signingKey = key.getPublicKey ? key.getPublicKey() : key.rsaPublicKey;
    return callback(null, signingKey);
  });
};

/**
 * Verify and decode an Auth0 RS256 JWT Access Token against Auth0 JWKS
 *
 * Validates:
 * - RS256 Algorithm
 * - JWT Signature via Auth0 Public Key
 * - Issuer (https://<AUTH0_DOMAIN>/)
 * - Audience (config.AUTH0_AUDIENCE)
 * - Expiration (exp)
 *
 * @param {string} token - The raw Bearer token string
 * @returns {Promise<object>} Decoded token payload
 */
export const verifyAuth0Token = (token) => {
  return new Promise((resolve, reject) => {
    if (!token || typeof token !== 'string') {
      return reject(new Error('Missing token string'));
    }

    const domain = config.AUTH0_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const validIssuers = [
      `https://${domain}/`,
      `https://${domain}`,
      config.AUTH0_ISSUER_BASE_URL,
    ];

    jwt.verify(
      token,
      getSigningKey,
      {
        algorithms: ['RS256'],
        audience: config.AUTH0_AUDIENCE,
        issuer: validIssuers,
      },
      (err, decoded) => {
        if (err) {
          return reject(err);
        }
        return resolve(decoded);
      }
    );
  });
};
