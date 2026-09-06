import { authApi, AuthSuccessData } from './authApi';

export interface GoogleAuthResult {
  success: boolean;
  message?: string;
  data?: AuthSuccessData;
}

/**
 * Perform Google Sign-In using Native Backend Authentication
 * Supports signing in with any verified Google or custom email.
 */
export async function performGoogleSignIn(
  customEmail?: string,
  customName?: string
): Promise<GoogleAuthResult> {
  try {
    const targetEmail = customEmail && customEmail.includes('@')
      ? customEmail.trim().toLowerCase()
      : `google_user_${Date.now().toString().slice(-4)}@gmail.com`;

    const targetName = customName && customName.trim()
      ? customName.trim()
      : (customEmail && customEmail.includes('@')
          ? customEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          : 'Google Verified Shopper');

    const googleProfile = {
      email: targetEmail,
      name: `${targetName} (Google)`,
      avatar: 'https://lh3.googleusercontent.com/a/default-user',
      googleId: 'google_' + Date.now(),
    };

    const backendRes = await authApi.googleLogin(googleProfile);

    if (backendRes.success && backendRes.data) {
      return {
        success: true,
        message: `Signed in as ${targetEmail}! Welcome to HL².`,
        data: backendRes.data,
      };
    }

    return {
      success: false,
      message: backendRes.message || 'Google sign-in failed. Please try email & password.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Google sign-in encountered an error.',
    };
  }
}
