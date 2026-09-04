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
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account & Settings</Text>
        <Text style={styles.headerSubtitle}>
          HL² Price Intelligence & Preferences
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 95 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------------------------- */}
        {/* 1. USER PROFILE & EMAIL CARD */}
        {/* ---------------------------------------------------- */}
        <View style={styles.userCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {isAuthenticated && user?.name ? user.name : 'Guest Shopper'}
              </Text>
              <View style={styles.emailRow}>
                <GoogleIcon name="email" size={13} color="#6B7280" style={{ marginRight: 4 }} />
                <Text style={styles.userEmail}>
                  {isAuthenticated && user?.email ? user.email : 'guest@hl2.app'}
                </Text>
              </View>

              <View style={styles.tierBadge}>
                <GoogleIcon name="verified-user" size={12} color="#2563EB" style={{ marginRight: 4 }} />
                <Text style={styles.tierText}>
                  {isAuthenticated ? 'VERIFIED HL² MEMBER' : 'GUEST EXPLORER'}
                </Text>
              </View>
            </View>
          </View>

          {isAuthenticated ? (
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <GoogleIcon name="logout" size={16} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
              activeOpacity={0.88}
            >
              <GoogleIcon name="login" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.signInBtnText}>Sign In / Register Account</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ---------------------------------------------------- */}
        {/* 2. ACTIVITY & PRICE SCOUT HUB */}
        {/* ---------------------------------------------------- */}
        <Text style={styles.sectionHeader}>Activity Hub</Text>
        <View style={styles.sectionCard}>
          {/* Watchlist */}
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Watchlist')}
          >
            <View style={styles.navIconBox}>
              <GoogleIcon name="bookmark-border" size={18} color="#0F172A" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Price Watchlist</Text>
              <Text style={styles.navSub}>View saved products and target tracking</Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Price Alerts */}
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Alerts')}
          >
            <View style={styles.navIconBox}>
              <GoogleIcon name="notifications-active" size={18} color="#2563EB" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Price Drop Alerts</Text>
              <Text style={styles.navSub}>Manage automated price-drop triggers</Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Search History */}
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Home')}
          >
            <View style={styles.navIconBox}>
              <GoogleIcon name="history" size={18} color="#0F172A" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Recent Search Audits</Text>
              <Text style={styles.navSub}>Recent analyzed links and searches</Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* ---------------------------------------------------- */}
        {/* 3. NOTIFICATION SETTINGS */}
        {/* ---------------------------------------------------- */}
        <Text style={styles.sectionHeader}>Notification Settings</Text>
        <View style={styles.sectionCard}>
          {/* Push Notifications Toggle */}
          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <View style={styles.switchTitleRow}>
                <GoogleIcon name="notifications" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.switchTitle}>Push Notifications</Text>
              </View>
              <Text style={styles.switchSub}>
                Instant mobile alerts when tracked prices fall to or below your target
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Email Alerts Toggle */}
          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <View style={styles.switchTitleRow}>
                <GoogleIcon name="mail-outline" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.switchTitle}>Email Drop Alerts</Text>
              </View>
              <Text style={styles.switchSub}>
                Send deal confirmations and price drop digests to your email
              </Text>
            </View>
            <Switch
              value={emailAlertsEnabled}
              onValueChange={setEmailAlertsEnabled}
              trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ---------------------------------------------------- */}
        {/* 4. LEGAL, PRIVACY & ABOUT HL² */}
        {/* ---------------------------------------------------- */}
        <Text style={styles.sectionHeader}>Legal & Disclosures</Text>
        <View style={styles.sectionCard}>
          {/* Privacy Policy */}
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => setActiveModal('privacy')}
          >
            <View style={styles.navIconBox}>
              <GoogleIcon name="security" size={18} color="#0F172A" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Privacy Policy</Text>
              <Text style={styles.navSub}>Data encryption, no data selling</Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Terms of Service */}
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => setActiveModal('terms')}
          >
            <View style={styles.navIconBox}>
              <GoogleIcon name="description" size={18} color="#0F172A" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Terms of Service</Text>
              <Text style={styles.navSub}>Affiliate disclosures & usage rules</Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* About HL² */}
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => setActiveModal('about')}
          >
            <View style={styles.navIconBox}>
              <GoogleIcon name="info" size={18} color="#2563EB" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>About HL²</Text>
              <Text style={styles.navSub}>Version 1.0.0, architecture & mission</Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* ---------------------------------------------------- */}
        {/* 5. DATA MANAGEMENT & DESTRUCTIVE ACTIONS */}
        {/* ---------------------------------------------------- */}
        <Text style={styles.sectionHeader}>Data Management</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={handleClearSearchHistory}
            disabled={isClearingHistory}
          >
            <View style={[styles.navIconBox, { backgroundColor: '#FEF2F2' }]}>
              <GoogleIcon name="delete-outline" size={18} color="#DC2626" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={[styles.navTitle, { color: '#DC2626' }]}>
                {isClearingHistory ? 'Clearing History...' : 'Clear Search History'}
              </Text>
              <Text style={styles.navSub}>Remove all cached product URLs and search entries</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer info */}
        <View style={styles.appFooter}>
          <View style={styles.footerBrandRow}>
            <Text style={styles.footerBrandBadge}>HL</Text>
            <Text style={styles.footerBrandSup}>²</Text>
            <Text style={styles.appFooterBrand}>Price Intelligence Engine</Text>
          </View>
          <Text style={styles.appFooterVersion}>Version 1.0.0 • Production Release</Text>
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
              <GoogleIcon name="close" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {activeModal === 'privacy' ? (
              <View style={styles.legalContent}>
                <Text style={styles.legalSectionTitle}>1. Privacy-First Architecture</Text>
                <Text style={styles.legalParagraph}>
                  HL² is engineered with strict data minimization principles. We do not sell, monetize, or broker your personal information to third parties.
                </Text>

                <Text style={styles.legalSectionTitle}>2. Information We Store</Text>
                <Text style={styles.legalParagraph}>
                  • Account Information: Name and email address required for authentication and price-drop notifications.{'\n'}
                  • Price Watchlists & Alerts: Products you explicitly track and target price thresholds.{'\n'}
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

                <Text style={styles.legalSectionTitle}>2. No Internal Checkout</Text>
                <Text style={styles.legalParagraph}>
                  HL² does not collect credit card information or process payments. All transactions occur exclusively on the authorized retailer's secure website.
                </Text>

                <Text style={styles.legalSectionTitle}>3. Affiliate Disclosure</Text>
                <Text style={styles.legalParagraph}>
                  When permitted by partner agreements, HL² may earn an affiliate commission on qualifying purchases made through external merchant links at zero extra cost to you.
                </Text>

                <Text style={styles.legalSectionTitle}>4. Price Accuracy Disclaimer</Text>
                <Text style={styles.legalParagraph}>
                  While HL² continuously audits pricing, live prices and stock availability on retailer websites may change rapidly. Always confirm the final price on the merchant's checkout page.
                </Text>
              </View>
            ) : (
              <View style={styles.legalContent}>
                <View style={styles.aboutHero}>
                  <View style={styles.aboutLogoBadge}>
                    <Text style={styles.aboutLogoText}>HL</Text>
                    <Text style={styles.aboutLogoSup}>²</Text>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.4,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  signOutBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
    marginBottom: 10,
    marginLeft: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  navIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navTextCol: {
    flex: 1,
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  navSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchTextCol: {
    flex: 1,
    marginRight: 12,
  },
  switchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  appFooter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerBrandBadge: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  footerBrandSup: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: -4,
    marginRight: 6,
  },
  appFooterBrand: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  appFooterVersion: {
    fontSize: 11,
    color: '#94A3B8',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  legalContent: {
    paddingBottom: 40,
  },
  legalSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 6,
  },
  legalParagraph: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  aboutHero: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 16,
  },
  aboutLogoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1.5,
    marginBottom: 10,
  },
  aboutLogoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  aboutLogoSup: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: -8,
  },
  aboutAppName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  aboutTagline: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
    marginTop: 2,
  },
});
