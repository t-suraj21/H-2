import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { GoogleIcon } from '../common/GoogleIcon';

interface SocialAuthButtonProps {
  type: 'google' | 'apple' | 'guest';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  label?: string;
}

export const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({
  type,
  onPress,
  loading = false,
  disabled = false,
  style,
  label,
}) => {
  if (type === 'google') {
    return (
      <TouchableOpacity
        style={[styles.baseButton, styles.googleButton, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.82}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#0F172A" />
        ) : (
          <View style={styles.buttonContent}>
            {/* Google Vector Icon */}
            <View style={styles.googleIconWrapper}>
              <FontAwesome name="google" size={18} color="#EA4335" />
            </View>
            <Text style={styles.googleButtonText}>{label || 'Continue with Google'}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (type === 'apple') {
    return (
      <TouchableOpacity
        style={[styles.baseButton, styles.appleButton, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <View style={styles.buttonContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.appleText}>{label || 'Continue with Apple'}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.baseButton, styles.guestButton, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#475569" />
      ) : (
        <View style={styles.buttonContent}>
          <View style={styles.iconContainer}>
            <GoogleIcon name="person-outline" size={19} color="#475569" />
          </View>
          <Text style={styles.guestText}>{label || 'Continue as Guest'}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  googleIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  appleButton: {
    backgroundColor: '#0F172A',
  },
  appleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  guestButton: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
  },
  guestText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
  },
  iconContainer: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
