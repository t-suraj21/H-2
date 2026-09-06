import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { SocialAuthButton } from '../components/auth/SocialAuthButton';
import { useAuth } from '../context/AuthContext';
import { AuthStackScreenProps } from '../navigation/types';
import { colors } from '../theme';
import { ShippingAddress } from '../services/authApi';

export const RegisterScreen: React.FC<AuthStackScreenProps<'Register'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { register, loginWithGoogle, guestLogin, isLoading } = useAuth();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Shipping Address State
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Field focus tracking
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const [cityFocused, setCityFocused] = useState(false);
  const [stateFocused, setStateFocused] = useState(false);
  const [pincodeFocused, setPincodeFocused] = useState(false);

  // Show/hide address section
  const [showAddressFields, setShowAddressFields] = useState(false);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return false;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }
    if (phone.trim()) {
      const phoneClean = phone.trim().replace(/[\s\-]/g, '');
      const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
      if (!phoneRegex.test(phoneClean)) {
        setErrorMessage('Please enter a valid 10-digit Indian phone number.');
        return false;
      }
    }
    if (!password) {
      setErrorMessage('Please enter a password.');
      return false;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return false;
    }
    if (pincode.trim()) {
      const pincodeRegex = /^[1-9][0-9]{5}$/;
      if (!pincodeRegex.test(pincode.trim())) {
        setErrorMessage('Please enter a valid 6-digit pincode.');
        return false;
      }
    }
    return true;
  };

  const handleRegister = async () => {
    setErrorMessage(null);
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const shippingAddress: ShippingAddress = {
        fullName: name.trim(),
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country: 'India',
      };

      const res = await register(
        name,
        email,
        password,
        phone.trim() || undefined,
        (addressLine1.trim() || city.trim() || state.trim() || pincode.trim())
          ? shippingAddress
          : undefined
      );
      if (res.success) {
        navigation.getParent()?.navigate('Main');
      } else {
        setErrorMessage(res.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Registration encountered an error. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMessage(null);
    setIsGoogleSubmitting(true);
    try {
      const res = await loginWithGoogle(email.trim() || undefined, name.trim() || undefined);
      if (res.success) {
        navigation.getParent()?.navigate('Main');
      } else if (res.message && !res.message.includes('cancelled')) {
        setErrorMessage(res.message);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Google sign-up failed. Please try again.'
      );
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleGuestContinue = async () => {
    setIsSubmitting(true);
    try {
      await guestLogin();
      navigation.getParent()?.navigate('Main');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isSubmitting || isGoogleSubmitting || isLoading;

  const clearError = () => {
    if (errorMessage) setErrorMessage(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>HL</Text>
              <Text style={styles.brandBadgeSup}>²</Text>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join HL² to shop on Amazon, Flipkart, Meesho & Myntra — all from one app with auto-fill.
            </Text>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <GoogleIcon name="error-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.formCard}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper, nameFocused && styles.inputWrapperFocused]}>
                <GoogleIcon
                  name="person-outline"
                  size={20}
                  color={nameFocused ? colors.brand.primaryGlow : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={(text) => { setName(text); clearError(); }}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isBusy}
                />
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                <GoogleIcon
                  name="mail-outline"
                  size={20}
                  color={emailFocused ? colors.brand.primaryGlow : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={(text) => { setEmail(text); clearError(); }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isBusy}
                />
              </View>
            </View>

            {/* Phone Number Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={[styles.inputWrapper, phoneFocused && styles.inputWrapperFocused]}>
                <GoogleIcon
                  name="phone"
                  size={20}
                  color={phoneFocused ? colors.brand.primaryGlow : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <Text style={styles.phonePrefix}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={(text) => { setPhone(text.replace(/[^0-9]/g, '').slice(0, 10)); clearError(); }}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!isBusy}
                />
              </View>
              <Text style={styles.fieldHint}>Used for auto-fill on shopping platforms</Text>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                <GoogleIcon
                  name="lock-outline"
                  size={20}
                  color={passwordFocused ? colors.brand.primaryGlow : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={(text) => { setPassword(text); clearError(); }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isBusy}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <GoogleIcon
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper, confirmPasswordFocused && styles.inputWrapperFocused]}>
                <GoogleIcon
                  name="lock-outline"
                  size={20}
                  color={confirmPasswordFocused ? colors.brand.primaryGlow : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={(text) => { setConfirmPassword(text); clearError(); }}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isBusy}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <GoogleIcon
                    name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* ─── Shipping Address Section (Collapsible) ──── */}
            <TouchableOpacity
              style={styles.addressToggle}
              onPress={() => setShowAddressFields(!showAddressFields)}
              activeOpacity={0.7}
            >
              <View style={styles.addressToggleLeft}>
                <GoogleIcon name="local-shipping" size={18} color="#2563EB" style={{ marginRight: 8 }} />
                <Text style={styles.addressToggleText}>
                  {showAddressFields ? 'Hide' : 'Add'} Shipping Address
                </Text>
              </View>
              <GoogleIcon
                name={showAddressFields ? 'expand-less' : 'expand-more'}
                size={22}
                color="#64748B"
              />
            </TouchableOpacity>

            {showAddressFields && (
              <View style={styles.addressSection}>
                <Text style={styles.addressSectionHint}>
                  Your address will be auto-filled on shopping platforms during checkout
                </Text>

                {/* Address Line 1 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address</Text>
                  <View style={[styles.inputWrapper, addressFocused && styles.inputWrapperFocused]}>
                    <GoogleIcon
                      name="location-on"
                      size={20}
                      color={addressFocused ? colors.brand.primaryGlow : '#94A3B8'}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="House/Flat no., Street, Landmark"
                      placeholderTextColor="#94A3B8"
                      value={addressLine1}
                      onChangeText={(text) => { setAddressLine1(text); clearError(); }}
                      onFocus={() => setAddressFocused(true)}
                      onBlur={() => setAddressFocused(false)}
                      autoCapitalize="words"
                      editable={!isBusy}
                    />
                  </View>
                </View>

                {/* City & State Row */}
                <View style={styles.rowFields}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>City</Text>
                    <View style={[styles.inputWrapper, cityFocused && styles.inputWrapperFocused]}>
                      <TextInput
                        style={styles.input}
                        placeholder="City"
                        placeholderTextColor="#94A3B8"
                        value={city}
                        onChangeText={(text) => { setCity(text); clearError(); }}
                        onFocus={() => setCityFocused(true)}
                        onBlur={() => setCityFocused(false)}
                        autoCapitalize="words"
                        editable={!isBusy}
                      />
                    </View>
                  </View>
                  <View style={{ width: 10 }} />
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>State</Text>
                    <View style={[styles.inputWrapper, stateFocused && styles.inputWrapperFocused]}>
                      <TextInput
                        style={styles.input}
                        placeholder="State"
                        placeholderTextColor="#94A3B8"
                        value={state}
                        onChangeText={(text) => { setState(text); clearError(); }}
                        onFocus={() => setStateFocused(true)}
                        onBlur={() => setStateFocused(false)}
                        autoCapitalize="words"
                        editable={!isBusy}
                      />
                    </View>
                  </View>
                </View>

                {/* Pincode */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pincode</Text>
                  <View style={[styles.inputWrapper, pincodeFocused && styles.inputWrapperFocused]}>
                    <GoogleIcon
                      name="pin-drop"
                      size={20}
                      color={pincodeFocused ? colors.brand.primaryGlow : '#94A3B8'}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="6-digit pincode"
                      placeholderTextColor="#94A3B8"
                      value={pincode}
                      onChangeText={(text) => { setPincode(text.replace(/[^0-9]/g, '').slice(0, 6)); clearError(); }}
                      onFocus={() => setPincodeFocused(true)}
                      onBlur={() => setPincodeFocused(false)}
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!isBusy}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Primary Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, isBusy && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isBusy}
              activeOpacity={0.88}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.btnInner}>
                  <Text style={styles.registerButtonText}>Create Account</Text>
                  <GoogleIcon name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or register with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign Up Button */}
            <SocialAuthButton
              type="google"
              label="Sign up with Google"
              onPress={handleGoogleSignUp}
              loading={isGoogleSubmitting}
              disabled={isBusy}
            />

            {/* Guest Continue Button */}
            <SocialAuthButton
              type="guest"
              label="Continue as Guest"
              onPress={handleGuestContinue}
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
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1.5,
    marginBottom: 10,
  },
  brandBadgeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  brandBadgeSup: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: -8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  formCard: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 5,
  },
  required: {
    color: '#DC2626',
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputWrapperFocused: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 0,
  },
  phonePrefix: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginRight: 6,
  },
  fieldHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    marginLeft: 2,
  },
  addressToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  addressToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  addressSection: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  addressSectionHint: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 15,
  },
  rowFields: {
    flexDirection: 'row',
  },
  registerButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 6,
  },
  footerPrompt: {
    fontSize: 14,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '700',
  },
});
