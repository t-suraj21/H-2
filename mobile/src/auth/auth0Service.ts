import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { authConfig } from './authConfig';

WebBrowser.maybeCompleteAuthSession();

export interface Auth0Tokens {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface Auth0User {
  sub?: string;
  name?: string;
  nickname?: string;
  email?: string;
  picture?: string;
  email_verified?: boolean;
  [key: string]: any;
}

/**
 * Safely decodes a standard JWT payload string without external dependencies
 */
export function decodeJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padLength = (4 - (base64.length % 4)) % 4;
      const paddedBase64 = base64 + '='.repeat(padLength);
      const binaryString = atob(paddedBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const jsonPayload = new TextDecoder('utf-8').decode(bytes);
      return JSON.parse(jsonPayload);
    }
  } catch (err) {
    console.warn('Failed to decode JWT payload:', err);
  }
  return null;
}

/**
 * Core Auth0 PKCE Authorization Flow for Universal Login & Social Login
 */
export async function loginWithAuth0(options?: {
  connection?: string;
  screen_hint?: string;
}): Promise<{ tokens: Auth0Tokens | null; user: Auth0User | null }> {
  const domain = authConfig.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: authConfig.customScheme || 'hl2',
    path: 'auth0-callback',
  });

  const discovery: AuthSession.DiscoveryDocument = {
    authorizationEndpoint: `https://${domain}/authorize`,
    tokenEndpoint: `https://${domain}/oauth/token`,
    revocationEndpoint: `https://${domain}/oauth/revoke`,
    userInfoEndpoint: `https://${domain}/userinfo`,
  };

  const extraParams: Record<string, string> = {
    prompt: 'login',
  };

  if (authConfig.audience) {
    extraParams.audience = authConfig.audience;
  }
  if (options?.connection) {
    extraParams.connection = options.connection;
  }
  if (options?.screen_hint) {
    extraParams.screen_hint = options.screen_hint;
  }

  const request = new AuthSession.AuthRequest({
    clientId: authConfig.clientId,
    scopes: authConfig.scope.split(' '),
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams,
  });

  const result = await request.promptAsync(discovery);

  if (result.type === 'success' && result.params.code) {
    // Exchange the authorization code for access and ID tokens via PKCE
    const tokenResult = await AuthSession.exchangeCodeAsync(
      {
        clientId: authConfig.clientId,
        code: result.params.code,
        redirectUri,
        extraParams: {
          code_verifier: request.codeVerifier || '',
        },
      },
      discovery
    );

    const tokens: Auth0Tokens = {
      accessToken: tokenResult.accessToken,
      idToken: tokenResult.idToken,
      refreshToken: tokenResult.refreshToken,
      expiresIn: tokenResult.expiresIn,
      tokenType: tokenResult.tokenType,
    };

    let user: Auth0User | null = null;
    if (tokens.idToken) {
      user = decodeJwt(tokens.idToken);
    }

    if (!user && tokens.accessToken && discovery.userInfoEndpoint) {
      try {
        const userInfoRes = await fetch(discovery.userInfoEndpoint, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        if (userInfoRes.ok) {
          user = await userInfoRes.json();
        }
      } catch {
        // Fallback gracefully if userInfo endpoint fails
      }
    }

    return { tokens, user };
  } else if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Sign in was cancelled.');
  } else if (result.type === 'error') {
    const errorDetails = (result as any).error?.description || (result as any).error?.message || result.params?.error_description || 'Authentication failed.';
    throw new Error(errorDetails);
  }

  return { tokens: null, user: null };
}

/**
 * Auth0 Universal Logout
 */
export async function logoutAuth0(): Promise<void> {
  const domain = authConfig.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const returnTo = AuthSession.makeRedirectUri({
    scheme: authConfig.customScheme || 'hl2',
    path: 'auth0-callback',
  });
  const logoutUrl = `https://${domain}/v2/logout?client_id=${authConfig.clientId}&returnTo=${encodeURIComponent(returnTo)}`;
  try {
    await WebBrowser.openAuthSessionAsync(logoutUrl, returnTo);
  } catch {
    // Logout session completed
  }
}
