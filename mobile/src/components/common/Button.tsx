import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { GoogleIcon, GoogleIconName } from './GoogleIcon';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'accent' | 'ghost';
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
        return colors.brand.primaryGlow;
      case 'secondary':
        return colors.text.primary;
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
      activeOpacity={0.8}
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
          color={variant === 'outline' || variant === 'ghost' ? colors.brand.primary : '#FFFFFF'}
        />
      ) : (
        <>
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
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  size_sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  size_md: {
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.lg,
  },
  size_lg: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
  },
  primary: {
    backgroundColor: colors.brand.primary,
  },
  secondary: {
    backgroundColor: colors.background.card,
    borderColor: colors.border.default,
    borderWidth: 1,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.brand.primary,
    borderWidth: 1.5,
  },
  accent: {
    backgroundColor: colors.brand.secondary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontWeight: typography.fontWeights.semibold,
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: colors.text.primary,
  },
  text_outline: {
    color: colors.brand.primaryGlow,
  },
  text_accent: {
    color: '#FFFFFF',
  },
  text_ghost: {
    color: colors.brand.primaryGlow,
  },
  text_size_sm: {
    fontSize: typography.fontSizes.xs + 1,
  },
  text_size_md: {
    fontSize: typography.fontSizes.sm,
  },
  text_size_lg: {
    fontSize: typography.fontSizes.md,
  },
});
