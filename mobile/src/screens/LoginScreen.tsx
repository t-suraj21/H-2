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

export const LoginScreen: React.FC<AuthStackScreenProps<'Login'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login, loginWithGoogle, guestLogin, isLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEmailAuth0Login = async () => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const res = await login();
      if (res.success) {
        navigation.getParent()?.navigate('Main');
      } else if (res.message && !res.message.includes('cancelled')) {
        setErrorMessage(res.message);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to sign in. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        navigation.getParent()?.navigate('Main');
      } else if (res.message && !res.message.includes('cancelled')) {
        setErrorMessage(res.message);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Google sign-in failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestContinue = async () => {
    await guestLogin();
    navigation.getParent()?.navigate('Main');
  };

  const isActionLoading = submitting || isLoading;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Brand Header */}
        <View style={styles.headerContainer}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>HL</Text>
            <Text style={styles.brandBadgeSup}>²</Text>
          </View>
          <Text style={styles.title}>Welcome to HL²</Text>
          <Text style={styles.subtitle}>
            Real-time cross-store price intelligence & verified deals across Amazon, Flipkart, & Croma.
          </Text>
        </View>

        {/* Hero Illustration */}
        <View style={styles.heroCard}>
          <Image
            source={require('../../assets/splash-hero.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Error Banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <GoogleIcon name="error-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Auth Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Continue with Google */}
          <SocialAuthButton
            type="google"
            onPress={handleGoogleLogin}
            disabled={isActionLoading}
          />

          {/* Continue with Email via Auth0 Universal Login */}
          <TouchableOpacity
            style={styles.emailBtn}
            onPress={handleEmailAuth0Login}
            disabled={isActionLoading}
            activeOpacity={0.85}
          >
            {isActionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.emailBtnInner}>
                <GoogleIcon name="mail-outline" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
                <Text style={styles.emailBtnText}>Continue with Email</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Continue as Guest */}
          <SocialAuthButton
            type="guest"
            onPress={handleGuestContinue}
            disabled={isActionLoading}
          />
        </View>

        {/* Security & Auth0 Attribution Footer */}
        <View style={styles.footerContainer}>
          <View style={styles.securityBadge}>
            <GoogleIcon name="lock" size={14} color="#16A34A" style={{ marginRight: 6 }} />
            <Text style={styles.securityText}>Secured by Auth0 Identity Platform</Text>
          </View>
          <Text style={styles.termsText}>
            By continuing, you agree to HL² Terms of Service & Privacy Policy.
          </Text>
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
    flexGrow: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F3FAF0',
    borderColor: '#E8EFE5',
    borderWidth: 1.5,
    marginBottom: 16,
  },
  brandBadgeText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#122E15',
  },
  brandBadgeSup: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: -10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#122E15', // Deep Forest Green
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  heroCard: {
    marginVertical: 12,
    alignItems: 'center',
  },
  heroImage: {
    width: 170,
    height: 170,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBF6E6',
  },
  errorBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  actionsContainer: {
    width: '100%',
    marginTop: 4,
  },
  emailBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#122E15', // Deep Forest Green
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    shadowColor: '#122E15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  emailBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingBottom: 8,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  termsText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

