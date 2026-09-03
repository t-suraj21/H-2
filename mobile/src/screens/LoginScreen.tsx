import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../theme';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { useAuth } from '../context/AuthContext';
import { AuthStackScreenProps } from '../navigation/types';

export const LoginScreen: React.FC<AuthStackScreenProps<'Login'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMessage(null);

    // Client-side validation
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(emailTrimmed, password);
      if (result.success) {
        // Navigate to Main app
        navigation.getParent()?.navigate('Main');
      } else {
        setErrorMessage(result.message);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back navigation */}
        <TouchableOpacity
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          style={styles.backBtn}
        >
          <GoogleIcon name="arrow-back-ios" size={16} color={colors.text.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {/* Branding header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>HL</Text>
            <Text style={styles.logoSup}>²</Text>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to sync your price alerts and watchlists across devices
          </Text>
        </View>

        {/* Error Banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <GoogleIcon name="error-outline" size={18} color={colors.status.error} style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Login Form Card */}
        <Card variant="glass" style={styles.formCard}>
          {/* Email Input */}
          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <GoogleIcon name="mail-outline" size={18} color={colors.text.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="name@example.com"
              placeholderTextColor={colors.text.muted}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errorMessage) setErrorMessage(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrapper}>
            <GoogleIcon name="lock-outline" size={18} color={colors.text.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor={colors.text.muted}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage(null);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <GoogleIcon
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={18}
                color={colors.text.muted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title={loading ? 'Signing In...' : 'Sign In'}
            icon="login"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleLogin}
            style={styles.submitBtn}
          />
        </Card>

        {/* Guest Continue */}
        <TouchableOpacity
          style={styles.guestBtn}
          onPress={() => navigation.getParent()?.navigate('Main')}
        >
          <Text style={styles.guestText}>Continue as Guest</Text>
          <GoogleIcon name="arrow-forward" size={16} color={colors.brand.primaryGlow} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {/* Navigation to Register */}
        <View style={styles.registerRow}>
          <Text style={styles.registerPrompt}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    justifyContent: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.border.subtle,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: radii.xl,
    backgroundColor: colors.background.card,
    borderColor: colors.border.brand,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 30,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.text.primary,
  },
  logoSup: {
    fontSize: 18,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.cyan,
    marginTop: -12,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSizes.xs + 1,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    color: colors.status.error,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  formCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSizes.sm,
    paddingVertical: spacing.md - 2,
  },
  eyeBtn: {
    padding: spacing.xs,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.primaryGlow,
  },
  submitBtn: {
    width: '100%',
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  guestText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primaryGlow,
    fontWeight: typography.fontWeights.semibold,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerPrompt: {
    fontSize: typography.fontSizes.xs + 1,
    color: colors.text.muted,
  },
  registerLink: {
    fontSize: typography.fontSizes.xs + 1,
    color: colors.brand.cyan,
    fontWeight: typography.fontWeights.bold,
  },
});
