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

export const RegisterScreen: React.FC<AuthStackScreenProps<'Register'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    setErrorMessage(null);

    // Client-side validation
    const nameTrimmed = fullName.trim();
    const emailTrimmed = email.trim();

    if (!nameTrimmed || nameTrimmed.length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!agreed) {
      setErrorMessage('Please accept the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    setLoading(true);
    try {
      const result = await register(nameTrimmed, emailTrimmed, password);
      if (result.success) {
        // Navigate to Main app
        navigation.getParent()?.navigate('Main');
      } else {
        setErrorMessage(result.message);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred during registration.');
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
          <Text style={styles.title}>Create HL² Account</Text>
          <Text style={styles.subtitle}>
            Join the smart commerce intelligence platform
          </Text>
        </View>

        {/* Error Banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <GoogleIcon name="error-outline" size={18} color={colors.status.error} style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Registration Form Card */}
        <Card variant="glass" style={styles.formCard}>
          {/* Full Name */}
          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <GoogleIcon name="person-outline" size={18} color={colors.text.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Alex Johnson"
              placeholderTextColor={colors.text.muted}
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errorMessage) setErrorMessage(null);
              }}
            />
          </View>

          {/* Email Address */}
          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <GoogleIcon name="mail-outline" size={18} color={colors.text.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="alex@example.com"
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

          {/* Password */}
          <Text style={styles.inputLabel}>Create Password (min. 8 characters)</Text>
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

          {/* Terms Agreement Checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            activeOpacity={0.8}
            onPress={() => setAgreed(!agreed)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed ? (
                <GoogleIcon name="check" size={14} color="#FFFFFF" />
              ) : null}
            </View>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.
            </Text>
          </TouchableOpacity>

          <Button
            title={loading ? 'Creating Account...' : 'Create Account'}
            icon="arrow-forward"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleRegister}
            style={styles.submitBtn}
          />
        </Card>

        {/* Navigation to Login */}
        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign In</Text>
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radii.xs,
    borderColor: colors.border.default,
    borderWidth: 1.5,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  termsText: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
    lineHeight: 16,
  },
  linkText: {
    color: colors.brand.cyan,
    fontWeight: typography.fontWeights.semibold,
  },
  submitBtn: {
    width: '100%',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPrompt: {
    fontSize: typography.fontSizes.xs + 1,
    color: colors.text.muted,
  },
  loginLink: {
    fontSize: typography.fontSizes.xs + 1,
    color: colors.brand.cyan,
    fontWeight: typography.fontWeights.bold,
  },
});
