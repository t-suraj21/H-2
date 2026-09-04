/**
 * Auth0 Mobile Client Configuration for HL²
 *
 * NOTE: These are strictly public client-side identifiers.
 * NEVER place client secrets, management tokens, or database passwords in this file.
 */

export const authConfig = {
  domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN || 'dev-hl2.us.auth0.com',
  clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID || 'client_id_placeholder_hl2_mobile',
  audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE || 'https://api.hl2.app',
  scope: 'openid profile email offline_access',
  customScheme: 'hl2',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api',
};

export default authConfig;
