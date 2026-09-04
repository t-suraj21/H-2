import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { GoogleIcon, GoogleIconName } from './GoogleIcon';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'accent' | 'ghost' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: GoogleIconName;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const getIconColor = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return '#0F172A';
      case 'secondary':
        return '#0F172A';
      case 'emerald':
      case 'accent':
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 16;
      case 'lg':
        return 22;
      default:
        return 18;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.button,
        styles[variant],
        styles[`size_${size}`],
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#0F172A' : '#FFFFFF'}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon ? (
            <GoogleIcon
              name={icon}
              size={getIconSize()}
              color={getIconColor()}
              style={styles.icon}
            />
          ) : null}
          <Text
            style={[
              styles.text,
              styles[`text_${variant}`],
              styles[`text_size_${size}`],
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  size_sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
  },
  size_md: {
    paddingVertical: spacing.md - 1,
    paddingHorizontal: spacing.lg,
    borderRadius: 26,
  },
  size_lg: {
    paddingVertical: spacing.md + 3,
    paddingHorizontal: spacing.xl,
    borderRadius: 28,
  },
  primary: {
    backgroundColor: '#0F172A', // Signature Midnight Navy
  },
  secondary: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1.2,
    shadowOpacity: 0.04,
  },
  emerald: {
    backgroundColor: '#2563EB', // Royal Blue
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#0F172A',
    borderWidth: 1.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  accent: {
    backgroundColor: '#2563EB', // Royal Blue
  },
  ghost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: '#0F172A',
  },
  text_emerald: {
    color: '#FFFFFF',
  },
  text_outline: {
    color: '#0F172A',
  },
  text_accent: {
    color: '#FFFFFF',
  },
  text_ghost: {
    color: '#0F172A',
  },
  text_size_sm: {
    fontSize: 13,
  },
  text_size_md: {
    fontSize: 15,
  },
  text_size_lg: {
    fontSize: 16,
  },
});
