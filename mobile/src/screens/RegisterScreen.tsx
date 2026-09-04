import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { SocialAuthButton } from '../components/auth/SocialAuthButton';
import { useAuth } from '../context/AuthContext';
import { AuthStackScreenProps } from '../navigation/types';

export const RegisterScreen: React.FC<AuthStackScreenProps<'Register'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { register, loginWithGoogle, guestLogin } = useAuth();

  const [loadingType, setLoadingType] = useState<'universal' | 'google' | 'guest' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAuth0SignUp = async () => {
    setErrorMessage(null);
    setLoadingType('universal');
    try {
      const result = await register();
      if (result.success) {
        navigation.getParent()?.navigate('Main');
      } else if (result.message && result.message !== 'Sign up cancelled.') {
        setErrorMessage(result.message);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Sign up encountered an unexpected error.');
    } finally {
      setLoadingType(null);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMessage(null);
    setLoadingType('google');
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        navigation.getParent()?.navigate('Main');
      } else if (result.message && result.message !== 'Google sign in cancelled.') {
        setErrorMessage(result.message);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Google sign in failed.');
    } finally {
      setLoadingType(null);
    }
  };

  const handleGuestContinue = async () => {
    setLoadingType('guest');
    try {
      await guestLogin();
      navigation.getParent()?.navigate('Main');
    } finally {
      setLoadingType(null);
    }
  };

  const isBusy = loadingType !== null;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroCard}>
            <Image
              source={require('../../assets/splash-hero.jpg')}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.title}>Create HL² Account</Text>
          <Text style={styles.subtitle}>
            Track prices across stores, receive smart drop alerts, and unlock multi-store deal intelligence.
          </Text>
        </View>

        {/* Error Alert */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <GoogleIcon name="error-outline" size={16} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {/* Continue with Google */}
          <SocialAuthButton
            type="google"
            onPress={handleGoogleSignUp}
            loading={loadingType === 'google'}
            disabled={isBusy}
          />

          {/* Primary Sign Up with Email (Auth0 Universal Login) */}
          <TouchableOpacity
            style={[styles.primaryButton, isBusy && styles.buttonDisabled]}
            onPress={handleAuth0SignUp}
            disabled={isBusy}
            activeOpacity={0.88}
          >
            {loadingType === 'universal' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.buttonInner}>
                <GoogleIcon name="mail-outline" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
                <Text style={styles.primaryButtonText}>Sign Up with Email</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or explore first</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Continue as Guest */}
          <SocialAuthButton
            type="guest"
            onPress={handleGuestContinue}
            loading={loadingType === 'guest'}
            disabled={isBusy}
          />
        </View>

        {/* Switch to Login */}
        <View style={styles.footerRow}>
          <Text style={styles.footerPrompt}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={isBusy}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.footerLink}>Log in</Text>
          </TouchableOpacity>
        </View>

        {/* Security & Identity Info */}
        <View style={styles.securityBadge}>
          <GoogleIcon name="lock-outline" size={13} color="#9CA3AF" style={{ marginRight: 4 }} />
          <Text style={styles.securityText}>Secured by Auth0 Universal Login • TLS 1.3</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heroCard: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#122E15', // Deep Forest Green
    letterSpacing: -0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  actionContainer: {
    width: '100%',
    marginVertical: 8,
  },
  primaryButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#122E15', // Deep Forest Green
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    shadowColor: '#122E15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  footerPrompt: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  footerLink: {
    fontSize: 14,
    color: '#122E15',
    fontWeight: '700',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  securityText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
