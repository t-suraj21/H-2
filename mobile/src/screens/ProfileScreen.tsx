import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../theme';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { GoogleIcon, GoogleIconName } from '../components/common/GoogleIcon';
import { useAuth } from '../context/AuthContext';
import { searchHistoryApi } from '../services/productApi';
import { MainTabScreenProps } from '../navigation/types';

type LegalModalType = 'privacy' | 'terms' | 'about' | null;

export const ProfileScreen: React.FC<MainTabScreenProps<'Profile'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout } = useAuth();

  // Notification & Preference states
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [activeModal, setActiveModal] = useState<LegalModalType>(null);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  // Destructive Action: Sign Out
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your HL² account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  // Destructive Action: Clear Search History
  const handleClearSearchHistory = () => {
    Alert.alert(
      'Clear Search History',
      'This will permanently delete all your recent product searches from HL². This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear History',
          style: 'destructive',
          onPress: async () => {
            setIsClearingHistory(true);
            try {
              const res = await searchHistoryApi.clearSearchHistory();
              if (res.success) {
                Alert.alert('History Cleared', 'Your search history has been wiped.');
              }
            } catch {
              Alert.alert('Error', 'Failed to clear search history. Please try again.');
            } finally {
              setIsClearingHistory(false);
            }
          },
        },
      ]
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return 'HL';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account & Settings</Text>
        <Text style={styles.headerSubtitle}>
          HL² Price Intelligence & Preferences
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------------------------- */}
        {/* 1. USER PROFILE & EMAIL CARD */}
        {/* ---------------------------------------------------- */}
        <Card variant="glass" style={styles.userCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {isAuthenticated && user?.name ? user.name : 'Guest Shopper'}
              </Text>
              <View style={styles.emailRow}>
                <GoogleIcon name="email" size={13} color={colors.text.muted} style={{ marginRight: 4 }} />
                <Text style={styles.userEmail}>
                  {isAuthenticated && user?.email ? user.email : 'guest@hl2.app'}
                </Text>
              </View>

              <View style={styles.tierBadge}>
                <GoogleIcon name="verified-user" size={12} color={colors.brand.cyan} style={{ marginRight: 3 }} />
                <Text style={styles.tierText}>
                  {isAuthenticated ? 'VERIFIED HL² MEMBER' : 'GUEST MODE'}
                </Text>
              </View>
            </View>
          </View>

          {isAuthenticated ? (
            <Button
              title="Sign Out"
              icon="logout"
              variant="secondary"
              size="sm"
              onPress={handleLogout}
              style={styles.authActionBtn}
              textStyle={{ color: colors.status.error }}
            />
          ) : (
            <Button
              title="Sign In / Register Account"
              icon="login"
              variant="outline"
              size="sm"
              onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
              style={styles.authActionBtn}
            />
          )}
        </Card>

        {/* ---------------------------------------------------- */}
        {/* 2. ACTIVITY & PRICE SCOUT HUB */}
        {/* ---------------------------------------------------- */}
        <Text style={styles.sectionHeader}>Activity Hub</Text>
        <Card variant="default" style={styles.sectionCard}>
          {/* Watchlist */}
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Watchlist')}
          >
            <View style={[styles.navIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
              <GoogleIcon name="bookmark-border" size={20} color={colors.brand.primaryGlow} />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Watchlist</Text>
              <Text style={styles.navSub}>View saved products and target tracking</Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color={colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Price Alerts */}
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Alerts')}
          >
            <View style={[styles.navIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <GoogleIcon name="notifications-active" size={20} color={colors.status.success} />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Price Alerts</Text>
              <Text style={styles.navSub}>Manage automated price-drop triggers</Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color={colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Search History */}
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Home')}
          >
            <View style={[styles.navIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.12)' }]}>
              <GoogleIcon name="history" size={20} color={colors.brand.cyan} />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Search History</Text>
              <Text style={styles.navSub}>Recent analyzed links and searches</Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color={colors.text.muted} />
          </TouchableOpacity>
        </Card>

        {/* ---------------------------------------------------- */}
        {/* 3. NOTIFICATION SETTINGS */}
        {/* ---------------------------------------------------- */}
        <Text style={styles.sectionHeader}>Notification Settings</Text>
        <Card variant="default" style={styles.sectionCard}>
          {/* Push Notifications Toggle */}
          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <View style={styles.switchTitleRow}>
                <GoogleIcon name="notifications" size={16} color={colors.brand.primaryGlow} style={{ marginRight: 6 }} />
                <Text style={styles.switchTitle}>Push Notifications</Text>
              </View>
              <Text style={styles.switchSub}>
                Instant mobile alerts when tracked prices fall to or below your target
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: colors.background.card, true: colors.brand.primary }}
              thumbColor={pushEnabled ? colors.brand.primaryGlow : colors.text.muted}
            />
          </View>

          <View style={styles.divider} />

          {/* Email Alerts Toggle */}
          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <View style={styles.switchTitleRow}>
                <GoogleIcon name="mail-outline" size={16} color={colors.brand.cyan} style={{ marginRight: 6 }} />
                <Text style={styles.switchTitle}>Email Drop Alerts</Text>
              </View>
              <Text style={styles.switchSub}>
                Send deal confirmations and weekly price digests to {user?.email || 'your email'}
              </Text>
            </View>
            <Switch
              value={emailAlertsEnabled}
              onValueChange={setEmailAlertsEnabled}
              trackColor={{ false: colors.background.card, true: colors.brand.primary }}
              thumbColor={emailAlertsEnabled ? colors.brand.cyan : colors.text.muted}
            />
          </View>
        </Card>

        {/* ---------------------------------------------------- */}
        {/* 4. LEGAL, PRIVACY & ABOUT HL² */}
        {/* ---------------------------------------------------- */}
        <Text style={styles.sectionHeader}>Legal & Disclosures</Text>
        <Card variant="default" style={styles.sectionCard}>
          {/* Privacy Policy */}
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => setActiveModal('privacy')}
          >
            <View style={[styles.navIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
              <GoogleIcon name="security" size={20} color={colors.brand.accent} />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Privacy Policy</Text>
              <Text style={styles.navSub}>Data encryption, no data selling</Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color={colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Terms of Service */}
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => setActiveModal('terms')}
          >
            <View style={[styles.navIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
              <GoogleIcon name="description" size={20} color={colors.status.warning} />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Terms of Service</Text>
              <Text style={styles.navSub}>Affiliate disclosures & usage rules</Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color={colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* About HL² */}
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => setActiveModal('about')}
          >
            <View style={[styles.navIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
              <GoogleIcon name="info" size={20} color={colors.brand.primaryGlow} />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>About HL²</Text>
              <Text style={styles.navSub}>Version 1.0.0, architecture & mission</Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color={colors.text.muted} />
          </TouchableOpacity>
        </Card>

        {/* ---------------------------------------------------- */}
        {/* 5. DATA MANAGEMENT & DESTRUCTIVE ACTIONS */}
        {/* ---------------------------------------------------- */}
        <Text style={styles.sectionHeader}>Data Management</Text>
        <Card variant="default" style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={handleClearSearchHistory}
            disabled={isClearingHistory}
          >
            <View style={[styles.navIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <GoogleIcon name="delete-outline" size={20} color={colors.status.error} />
            </View>
            <View style={styles.navTextCol}>
              <Text style={[styles.navTitle, { color: colors.status.error }]}>
                {isClearingHistory ? 'Clearing History...' : 'Clear Search History'}
              </Text>
              <Text style={styles.navSub}>Remove all cached product URLs and search entries</Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Footer info */}
        <View style={styles.appFooter}>
          <Text style={styles.appFooterBrand}>HL² — Smart Price Intelligence Engine</Text>
          <Text style={styles.appFooterVersion}>Version 1.0.0 • Production Build 2026</Text>
        </View>
      </ScrollView>

      {/* ---------------------------------------------------- */}
      {/* 6. LEGAL & ABOUT MODAL SHEETS */}
      {/* ---------------------------------------------------- */}
      <Modal
        visible={activeModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {activeModal === 'privacy'
                ? 'Privacy Policy'
                : activeModal === 'terms'
                ? 'Terms of Service'
                : 'About HL²'}
            </Text>
            <TouchableOpacity
              onPress={() => setActiveModal(null)}
              style={styles.modalCloseBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <GoogleIcon name="close" size={22} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {activeModal === 'privacy' ? (
              <View style={styles.legalContent}>
                <Text style={styles.legalSectionTitle}>1. Privacy-First Architecture</Text>
                <Text style={styles.legalParagraph}>
                  HL² is engineered with strict data minimization principles. We do not sell, monetize, or broker your personal information to data brokers or advertising exchanges.
                </Text>

                <Text style={styles.legalSectionTitle}>2. Information We Store</Text>
                <Text style={styles.legalParagraph}>
                  • Account Information: Name and email address required for secure authentication and price-drop notifications.{'\n'}
                  • Price Watchlists & Alerts: Products you explicitly save and target price thresholds.{'\n'}
                  • Search History: Cleaned product URLs (capped at a maximum of 50 items per account).
                </Text>

                <Text style={styles.legalSectionTitle}>3. Push Notification Security</Text>
                <Text style={styles.legalParagraph}>
                  Push device tokens are transmitted over TLS encryption and used solely for delivering price drop alerts triggered by your explicit target prices.
                </Text>

                <Text style={styles.legalSectionTitle}>4. Right to Deletion</Text>
                <Text style={styles.legalParagraph}>
                  You maintain complete control over your data. You can clear your search history or delete specific price alerts at any time with a single tap.
                </Text>
              </View>
            ) : activeModal === 'terms' ? (
              <View style={styles.legalContent}>
                <Text style={styles.legalSectionTitle}>1. Authorized Retailer Redirection</Text>
                <Text style={styles.legalParagraph}>
                  HL² is an independent price comparison and deal analysis platform. Tapping "Buy on Retailer" opens authorized external store websites (such as Amazon, Flipkart, and Croma).
                </Text>

                <Text style={styles.legalSectionTitle}>2. No Internal Checkout or Payment Processing</Text>
                <Text style={styles.legalParagraph}>
                  HL² does not collect credit card information, process payments, or handle merchant order fulfillment. All transactions occur exclusively on the authorized retailer's secure website.
                </Text>

                <Text style={styles.legalSectionTitle}>3. Affiliate Disclosure</Text>
                <Text style={styles.legalParagraph}>
                  When permitted by partner agreements, HL² may earn an affiliate commission on qualifying purchases made through external merchant links at zero extra cost to you.
                </Text>

                <Text style={styles.legalSectionTitle}>4. Price Accuracy Disclaimer</Text>
                <Text style={styles.legalParagraph}>
                  While HL² continuously audits pricing with high-frequency queues, live prices and stock availability on retailer websites may change rapidly. Always confirm the final price on the merchant's checkout page.
                </Text>
              </View>
            ) : (
              <View style={styles.legalContent}>
                <View style={styles.aboutHero}>
                  <View style={styles.aboutLogoBadge}>
                    <Text style={styles.aboutLogoText}>HL²</Text>
                  </View>
                  <Text style={styles.aboutAppName}>HL² Price Intelligence</Text>
                  <Text style={styles.aboutTagline}>Compare. Analyze. Buy Smarter.</Text>
                </View>

                <Text style={styles.legalSectionTitle}>Our Mission</Text>
                <Text style={styles.legalParagraph}>
                  HL² empowers shoppers to make confident purchasing decisions by eliminating fake discounts, tracking authentic historical pricing, and discovering the lowest effective price across major retailers.
                </Text>

                <Text style={styles.legalSectionTitle}>Supported E-Commerce Retailers</Text>
                <Text style={styles.legalParagraph}>
                  • Amazon India & Global (.in, .com, amzn.to){'\n'}
                  • Flipkart Online Store{'\n'}
                  • Croma Electronics
                </Text>

                <Text style={styles.legalSectionTitle}>Core Capabilities</Text>
                <Text style={styles.legalParagraph}>
                  • Real-Time Product URL Analyzer{'\n'}
                  • Multi-Store Price Comparison Engine{'\n'}
                  • 180-Day Historical Price Trends & Moving Averages{'\n'}
                  • Automated Background Price-Drop Queues & Push Alerts
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  userCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: radii.full,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderColor: colors.brand.primaryGlow,
    borderWidth: 2,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSizes.md + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
  },
  tierText: {
    color: colors.brand.cyan,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  authActionBtn: {
    width: '100%',
  },
  sectionHeader: {
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  navIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  navTextCol: {
    flex: 1,
  },
  navTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
  navSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  switchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  switchTextCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  switchTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
  switchSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  appFooter: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  appFooterBrand: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.muted,
  },
  appFooterVersion: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  modalTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  modalCloseBtn: {
    padding: spacing.xs,
  },
  modalBody: {
    flex: 1,
    padding: spacing.lg,
  },
  legalContent: {
    paddingBottom: spacing.xxl,
  },
  legalSectionTitle: {
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  legalParagraph: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  aboutHero: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  aboutLogoBadge: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
  },
  aboutLogoText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
  },
  aboutAppName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  aboutTagline: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.primaryGlow,
    marginTop: 2,
  },
});
