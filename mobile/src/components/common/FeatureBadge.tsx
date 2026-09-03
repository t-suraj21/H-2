import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { GoogleIcon, GoogleIconName } from './GoogleIcon';

interface FeatureBadgeProps {
  icon: GoogleIconName;
  title: string;
  description: string;
  iconColor?: string;
}

export const FeatureBadge: React.FC<FeatureBadgeProps> = ({
  icon,
  title,
  description,
  iconColor = colors.brand.primaryGlow,
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
        <GoogleIcon name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.brand,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  description: {
    fontSize: typography.fontSizes.xs + 1,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
