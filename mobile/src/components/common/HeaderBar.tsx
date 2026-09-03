import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, radii } from '../../theme';
import { GoogleIcon, GoogleIconName } from './GoogleIcon';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: {
    icon: GoogleIconName;
    onPress: () => void;
    label?: string;
  };
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  showBack = true,
  rightAction,
}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack && navigation.canGoBack() ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <GoogleIcon name="arrow-back-ios" size={16} color={colors.text.primary} style={styles.backIcon} />
          </TouchableOpacity>
        ) : (
          <View style={styles.brandDot} />
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightAction ? (
        <TouchableOpacity
          onPress={rightAction.onPress}
          style={styles.rightButton}
          activeOpacity={0.7}
        >
          <GoogleIcon name={rightAction.icon} size={18} color={colors.brand.primaryGlow} style={styles.rightIcon} />
          {rightAction.label ? (
            <Text style={styles.rightLabel}>{rightAction.label}</Text>
          ) : null}
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderColor: colors.border.subtle,
    borderWidth: 1,
  },
  backIcon: {
    marginLeft: 4,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.brand.primary,
    marginRight: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
    marginTop: 1,
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderRadius: radii.md,
    borderColor: colors.border.brand,
    borderWidth: 1,
  },
  rightIcon: {
    marginRight: 4,
  },
  rightLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.primaryGlow,
  },
});
