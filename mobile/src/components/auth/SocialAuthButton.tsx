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
import { GoogleIcon } from '../common/GoogleIcon';

interface SocialAuthButtonProps {
  type: 'google' | 'apple' | 'guest';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({
  type,
  onPress,
  loading = false,
  disabled = false,
  style,
}) => {
  if (type === 'apple') {
    return (
      <TouchableOpacity
        style={[styles.baseButton, styles.appleButton, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#111827" />
        ) : (
          <View style={styles.buttonContent}>
            {/* Apple Icon */}
            <View style={styles.iconContainer}>
              <GoogleIcon name="apple" size={20} color="#111827" />
            </View>
            <Text style={styles.appleText}>Continue with Apple</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (type === 'google') {
    return (
      <TouchableOpacity
        style={[styles.baseButton, styles.mintButton, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#1F2937" />
        ) : (
          <View style={styles.buttonContent}>
            {/* Google Colored Logo Circle */}
            <View style={styles.googleIconContainer}>
              <Text style={styles.googleG}>G</Text>
            </View>
            <Text style={styles.mintText}>Continue with Google</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.baseButton, styles.mintButton, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#1F2937" />
      ) : (
        <View style={styles.buttonContent}>
          <View style={styles.iconContainer}>
            <GoogleIcon name="account-circle" size={20} color="#111827" />
          </View>
          <Text style={styles.mintText}>Continue As Guest</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleButton: {
    backgroundColor: '#84E152', // Vibrant Matcha Lime Green
  },
  appleText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  mintButton: {
    backgroundColor: '#F0F7ED', // Soft Mint Light Pill
  },
  mintText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  iconContainer: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleG: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
