import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../theme';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { RootStackScreenProps } from '../navigation/types';

export const SplashScreen: React.FC<RootStackScreenProps<'Splash'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Auto-transition to Main app after 2.5s if not manually clicked
    const timer = setTimeout(() => {
      navigation.replace('Main');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        {/* Glowing Logo Container */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>HL</Text>
            <Text style={styles.logoSup}>²</Text>
          </View>
          <View style={styles.glowRing} />
        </View>

        {/* Brand Tagline */}
        <Text style={styles.tagline}>Compare. Analyze. Buy Smarter.</Text>
        <Text style={styles.subtext}>
          Real-time cross-store intelligence & verified price audit
        </Text>

        {/* Status Indicator */}
        <View style={styles.statusPill}>
          <GoogleIcon name="auto-awesome" size={14} color={colors.brand.cyan} style={styles.statusIcon} />
          <Text style={styles.statusText}>Initializing Price Engine...</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.replace('Main')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Explore Dashboard</Text>
            <GoogleIcon name="arrow-forward" size={18} color="#FFFFFF" style={styles.btnIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.authBtn}
            onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
            activeOpacity={0.8}
          >
            <GoogleIcon name="login" size={16} color={colors.text.secondary} style={styles.btnIcon} />
            <Text style={styles.authBtnText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>HL² Intelligence Engine v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 104,
    height: 104,
    borderRadius: radii.xl,
    backgroundColor: colors.background.card,
    borderColor: colors.border.brand,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 44,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.text.primary,
    letterSpacing: -1,
  },
  logoSup: {
    fontSize: 26,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.cyan,
    marginTop: -18,
  },
  glowRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    zIndex: -1,
  },
  tagline: {
    fontSize: typography.fontSizes.xl + 2,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  subtext: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    lineHeight: 20,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    marginBottom: spacing.xxl,
  },
  statusIcon: {
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.cyan,
    fontWeight: typography.fontWeights.semibold,
  },
  actionRow: {
    width: '100%',
    gap: spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.bold,
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderColor: colors.border.default,
    borderWidth: 1,
    paddingVertical: spacing.md - 2,
    borderRadius: radii.md,
  },
  authBtnText: {
    color: colors.text.secondary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  btnIcon: {
    marginLeft: spacing.xs,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  versionText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
  },
});
