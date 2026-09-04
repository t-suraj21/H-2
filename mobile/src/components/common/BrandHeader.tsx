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
        <GoogleIcon name="auto-awesome" size={14} color="#2563EB" style={styles.badgeIcon} />
        <Text style={styles.badgeText}>INTELLIGENT COMMERCE</Text>
      </View>

      <View style={styles.brandBadge}>
        <Text style={styles.brandBadgeText}>HL</Text>
        <Text style={styles.brandBadgeSup}>²</Text>
      </View>

      <Text style={styles.tagline}>{tagline}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeIcon: {
    marginRight: 6,
  },
  badgeText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
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
    marginBottom: 8,
  },
  brandBadgeText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  brandBadgeSup: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: -10,
  },
  tagline: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
