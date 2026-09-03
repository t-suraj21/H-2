import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { GoogleIcon } from './GoogleIcon';

interface BrandHeaderProps {
  title?: string;
  tagline?: string;
  subtitle?: string;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  title = 'HL²',
  tagline = 'Compare. Analyze. Buy Smarter.',
  subtitle,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.badgeContainer}>
        <GoogleIcon name="auto-awesome" size={14} color={colors.brand.cyan} style={styles.badgeIcon} />
        <Text style={styles.badgeText}>INTELLIGENT COMMERCE</Text>
      </View>

      <View style={styles.logoRow}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <Text style={styles.tagline}>{tagline}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.35)',
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginBottom: spacing.sm,
  },
  badgeIcon: {
    marginRight: spacing.xs,
  },
  badgeText: {
    color: colors.brand.cyan,
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 1.2,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xxs,
  },
  title: {
    fontSize: typography.fontSizes.hero + 6,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.text.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: typography.fontSizes.md + 1,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.primaryGlow,
    textAlign: 'center',
    letterSpacing: -0.2,
    marginTop: spacing.xxs,
  },
  subtitle: {
    fontSize: typography.fontSizes.xs + 1,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
});
