import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleIcon, GoogleIconName } from '../components/common/GoogleIcon';
import { useAuth } from '../context/AuthContext';
import { productApi, watchlistApi, alertApi } from '../services/productApi';
import { MainTabScreenProps } from '../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;

// ─── Real Shopping Platforms ──────────────────────────────────────────
interface ShoppingPlatform {
  id: string;
  name: string;
  tagline: string;
  url: string;
  color: string;
  bgGradientStart: string;
  bgGradientEnd: string;
  icon: GoogleIconName;
  description: string;
}

const SHOPPING_PLATFORMS: ShoppingPlatform[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    tagline: 'Everything Store',
    url: 'https://www.amazon.in',
    color: '#FF9900',
    bgGradientStart: '#FFF8EC',
    bgGradientEnd: '#FFF1D6',
    icon: 'local-mall',
    description: 'Electronics, fashion, home & more with Prime delivery',
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    tagline: 'India\'s #1 Marketplace',
    url: 'https://www.flipkart.com',
    color: '#2874F0',
    bgGradientStart: '#EEF4FF',
    bgGradientEnd: '#DBEAFE',
    icon: 'storefront',
    description: 'Best deals on mobiles, electronics, fashion & groceries',
  },
  {
    id: 'meesho',
    name: 'Meesho',
    tagline: 'Lowest Prices',
    url: 'https://www.meesho.com',
    color: '#570741',
    bgGradientStart: '#FDF2F8',
    bgGradientEnd: '#FCE7F3',
    icon: 'shopping-bag',
    description: 'Affordable fashion, home decor & daily essentials',
  },
  {
    id: 'myntra',
    name: 'Myntra',
    tagline: 'Fashion Hub',
    url: 'https://www.myntra.com',
    color: '#FF3F6C',
    bgGradientStart: '#FFF1F2',
    bgGradientEnd: '#FFE4E6',
    icon: 'checkroom',
    description: 'Premium fashion brands, beauty & lifestyle products',
  },
];

// ─── Featured Deal Links ──────────────────────────────────────────────
interface FeaturedDeal {
  id: string;
  title: string;
  platform: string;
  platformColor: string;
  url: string;
  icon: GoogleIconName;
  badge: string;
}

const FEATURED_DEALS: FeaturedDeal[] = [
  {
    id: 'deal-1',
    title: 'Electronics Sale',
    platform: 'Amazon',
    platformColor: '#FF9900',
    url: 'https://www.amazon.in/deals',
    icon: 'devices',
    badge: 'Up to 70% Off',
  },
  {
    id: 'deal-2',
    title: 'Fashion Deals',
    platform: 'Flipkart',
    platformColor: '#2874F0',
    url: 'https://www.flipkart.com/offers',
    icon: 'style',
    badge: 'Min 40% Off',
  },
  {
    id: 'deal-3',
    title: 'Budget Finds',
    platform: 'Meesho',
    platformColor: '#570741',
    url: 'https://www.meesho.com',
    icon: 'sell',
    badge: 'Under ₹499',
  },
  {
    id: 'deal-4',
    title: 'Brand Sale',
    platform: 'Myntra',
    platformColor: '#FF3F6C',
    url: 'https://www.myntra.com/shop/end-of-reason-sale',
    icon: 'loyalty',
    badge: 'Top Brands',
  },
];

// ─── Quick Action Buttons ─────────────────────────────────────────────
interface QuickAction {
  id: string;
  label: string;
  icon: GoogleIconName;
  color: string;
  bgColor: string;
  screen?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'compare',
    label: 'Compare Prices',
    icon: 'compare-arrows',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    screen: 'AnalyzeProduct',
  },
  {
    id: 'watchlist',
    label: 'My Watchlist',
    icon: 'bookmark',
    color: '#059669',
    bgColor: '#ECFDF5',
    screen: 'Watchlist',
  },
  {
    id: 'alerts',
    label: 'Price Alerts',
    icon: 'notifications-active',
    color: '#D97706',
    bgColor: '#FFFBEB',
    screen: 'Alerts',
  },
  {
    id: 'history',
    label: 'Price History',
    icon: 'trending-down',
    color: '#DC2626',
    bgColor: '#FEF2F2',
  },
];

// ─── Component ────────────────────────────────────────────────────────
export const HomeScreen: React.FC<MainTabScreenProps<'Home'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, token, isAuthenticated, refreshUser } = useAuth();

  const [watchlistCount, setWatchlistCount] = useState<number | null>(null);
  const [alertsCount, setAlertsCount] = useState<number | null>(null);
  const [searchUrl, setSearchUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch live stats from backend MongoDB
  const fetchLiveStats = useCallback(async () => {
    if (isAuthenticated && token) {
      try {
        const [watchRes, alertRes] = await Promise.all([
          watchlistApi.getWatchlist(token),
          alertApi.getAlerts(token),
        ]);
        if (watchRes.success && Array.isArray(watchRes.data)) {
          setWatchlistCount(watchRes.data.length);
        }
        if (alertRes.success && Array.isArray(alertRes.data)) {
          setAlertsCount(alertRes.data.length);
        }
      } catch {}
    }
  }, [isAuthenticated, token]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isAuthenticated) {
        await refreshUser();
      }
      await fetchLiveStats();
    } finally {
      setRefreshing(false);
    }
  }, [isAuthenticated, refreshUser, fetchLiveStats]);

  useEffect(() => {
    fetchLiveStats();
  }, [fetchLiveStats]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleOpenPlatform = useCallback(
    (platform: ShoppingPlatform) => {
      navigation.navigate('ShoppingWebView', {
        platformName: platform.name,
        url: platform.url,
        color: platform.color,
      });
    },
    [navigation]
  );

  const handleOpenDeal = useCallback(
    (deal: FeaturedDeal) => {
      navigation.navigate('ShoppingWebView', {
        platformName: deal.platform,
        url: deal.url,
        color: deal.platformColor,
      });
    },
    [navigation]
  );

  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      if (action.screen === 'AnalyzeProduct') {
        navigation.navigate('AnalyzeProduct', {});
      } else if (action.screen === 'Watchlist') {
        navigation.navigate('Watchlist');
      } else if (action.screen === 'Alerts') {
        navigation.navigate('Alerts');
      } else if (action.id === 'history') {
        navigation.navigate('AnalyzeProduct', { initialUrl: 'https://www.amazon.in/dp/B09XS7JWHH' });
      }
    },
    [navigation]
  );

  const handleQuickAnalyze = async () => {
    const trimmed = searchUrl.trim();
    if (!trimmed) {
      Alert.alert(
        'Product URL Required',
        'Please enter or paste a valid product link from Amazon, Flipkart, or Croma.'
      );
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await productApi.analyzeUrl(trimmed);
      if (res.success && res.data) {
        setSearchUrl('');
        navigation.navigate('AnalyzeProduct', { initialUrl: trimmed });
      } else {
        Alert.alert(
          'Analysis Notice',
          res.message || 'Could not auto-verify URL. Opening comparison tool...'
        );
        navigation.navigate('AnalyzeProduct', { initialUrl: trimmed });
      }
    } catch {
      navigation.navigate('AnalyzeProduct', { initialUrl: trimmed });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <ScrollView
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 95 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
      >
        {/* ─── Top Header with Brand ────────────────── */}
        <View style={styles.topHeader}>
          <View style={styles.topHeaderLeft}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>HL</Text>
              <Text style={styles.brandBadgeSup}>²</Text>
            </View>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>
                {user?.name
                  ? `${getGreeting()}, ${user.name.split(' ')[0]} 👋`
                  : 'Welcome to HL² 👋'}
              </Text>
              <View style={styles.livePulseRow}>
                <View style={styles.livePulse} />
                <Text style={styles.livePulseText}>Connected to MongoDB Cloud</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.profileAvatarButton}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'HL'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── Hero Section ─────────────────────────── */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>All Your Stores,{'\n'}One App</Text>
          <Text style={styles.heroSubtitle}>
            Shop on Amazon, Flipkart, Meesho & Myntra — all from HL². 
            Your credentials auto-fill on every platform.
          </Text>
        </View>

        {/* ─── Instant Product Price Analyzer Bar (Connected to Backend) ─── */}
        <View style={styles.analyzerBox}>
          <View style={styles.analyzerTitleRow}>
            <GoogleIcon name="manage-search" size={20} color="#2563EB" style={{ marginRight: 6 }} />
            <Text style={styles.analyzerTitle}>Instant Price Check</Text>
            <View style={styles.liveDbTag}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.liveDbText}>Live Backend</Text>
            </View>
          </View>
          <Text style={styles.analyzerSubtitle}>
            Paste any Amazon, Flipkart, or Croma link to audit prices across stores
          </Text>
          <View style={styles.analyzerInputRow}>
            <TextInput
              style={styles.analyzerInput}
              value={searchUrl}
              onChangeText={setSearchUrl}
              placeholder="Paste product link (https://...)"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.analyzerButton}
              onPress={handleQuickAnalyze}
              disabled={isAnalyzing}
              activeOpacity={0.8}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <GoogleIcon name="search" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.analyzerButtonText}>Check</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Quick Actions Row ────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsRow}
        >
          {QUICK_ACTIONS.map((action) => {
            let labelText = action.label;
            if (action.id === 'watchlist' && watchlistCount !== null) {
              labelText = `Watchlist (${watchlistCount})`;
            } else if (action.id === 'alerts' && alertsCount !== null) {
              labelText = `Alerts (${alertsCount})`;
            }

            return (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionChip}
                onPress={() => handleQuickAction(action)}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.bgColor }]}>
                  <GoogleIcon name={action.icon} size={18} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{labelText}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── Shopping Platforms Grid ──────────────── */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <GoogleIcon name="store" size={20} color="#0F172A" style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeading}>Shopping Platforms</Text>
          </View>
          <View style={styles.platformCountBadge}>
            <Text style={styles.platformCountText}>{SHOPPING_PLATFORMS.length} Stores</Text>
          </View>
        </View>

        <View style={styles.platformGrid}>
          {SHOPPING_PLATFORMS.map((platform) => (
            <TouchableOpacity
              key={platform.id}
              style={[
                styles.platformCard,
                { backgroundColor: platform.bgGradientStart },
              ]}
              onPress={() => handleOpenPlatform(platform)}
              activeOpacity={0.85}
            >
              {/* Platform Icon */}
              <View style={[styles.platformIconCircle, { backgroundColor: platform.color }]}>
                <GoogleIcon name={platform.icon} size={26} color="#FFFFFF" />
              </View>

              {/* Platform Info */}
              <Text style={styles.platformName}>{platform.name}</Text>
              <Text style={[styles.platformTagline, { color: platform.color }]}>
                {platform.tagline}
              </Text>
              <Text style={styles.platformDesc} numberOfLines={2}>
                {platform.description}
              </Text>

              {/* Open Button */}
              <View style={[styles.openStoreBtn, { backgroundColor: platform.color }]}>
                <Text style={styles.openStoreBtnText}>Open Store</Text>
                <GoogleIcon name="arrow-forward" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Featured Deals ──────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <GoogleIcon name="local-fire-department" size={20} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeading}>Featured Deals</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dealsScrollContainer}
        >
          {FEATURED_DEALS.map((deal) => (
            <TouchableOpacity
              key={deal.id}
              style={styles.dealCard}
              onPress={() => handleOpenDeal(deal)}
              activeOpacity={0.85}
            >
              <View style={styles.dealTopRow}>
                <View style={[styles.dealIconCircle, { backgroundColor: deal.platformColor + '18' }]}>
                  <GoogleIcon name={deal.icon} size={22} color={deal.platformColor} />
                </View>
                <View style={[styles.dealBadge, { backgroundColor: deal.platformColor }]}>
                  <Text style={styles.dealBadgeText}>{deal.badge}</Text>
                </View>
              </View>

              <Text style={styles.dealTitle}>{deal.title}</Text>
              <View style={styles.dealFooter}>
                <Text style={[styles.dealPlatformName, { color: deal.platformColor }]}>
                  {deal.platform}
                </Text>
                <GoogleIcon name="arrow-forward" size={14} color={deal.platformColor} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ─── How It Works ────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <GoogleIcon name="info-outline" size={20} color="#0F172A" style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeading}>How HL² Works</Text>
          </View>
        </View>

        <View style={styles.howItWorksContainer}>
          {[
            {
              step: '1',
              title: 'Register Once',
              desc: 'Sign up with your name, email, phone & shipping address.',
              icon: 'person-add' as GoogleIconName,
            },
            {
              step: '2',
              title: 'Browse Any Store',
              desc: 'Open Amazon, Flipkart, Meesho, or Myntra directly in HL².',
              icon: 'store' as GoogleIconName,
            },
            {
              step: '3',
              title: 'Auto-Fill & Shop',
              desc: 'Your details auto-fill on login & checkout. Shop seamlessly!',
              icon: 'auto-fix-high' as GoogleIconName,
            },
          ].map((item) => (
            <View key={item.step} style={styles.howStepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>{item.step}</Text>
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepTitleRow}>
                  <GoogleIcon name={item.icon} size={16} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text style={styles.stepTitle}>{item.title}</Text>
                </View>
                <Text style={styles.stepDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ─── Connected Platforms Strip ────────────── */}
        <View style={styles.connectedStrip}>
          <View style={styles.connectedStripHeader}>
            <GoogleIcon name="verified" size={16} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.connectedLabel}>Connected Platforms</Text>
          </View>
          <View style={styles.connectedLogos}>
            {SHOPPING_PLATFORMS.map((p) => (
              <View key={p.id} style={[styles.connectedChip, { borderColor: p.color + '40' }]}>
                <View style={[styles.connectedDot, { backgroundColor: p.color }]} />
                <Text style={[styles.connectedChipText, { color: p.color }]}>{p.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },

  // ── Top Header ──────────────────────
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1.5,
    marginRight: 12,
  },
  brandBadgeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  brandBadgeSup: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: -8,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  livePulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  livePulse: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#059669',
    marginRight: 6,
  },
  livePulseText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  profileAvatarButton: {
    padding: 2,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Hero Section ────────────────────
  heroSection: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
    lineHeight: 34,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },

  // ── Quick Actions ───────────────────
  quickActionsRow: {
    gap: 10,
    paddingBottom: 4,
    marginBottom: 22,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },

  // ── Section Headers ─────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  platformCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  platformCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },

  // ── Platform Cards Grid ─────────────
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  platformCard: {
    width: CARD_WIDTH,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  platformIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  platformName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  platformTagline: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  platformDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 12,
    minHeight: 30,
  },
  openStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 18,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  openStoreBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },

  // ── Featured Deals ──────────────────
  dealsScrollContainer: {
    gap: 12,
    paddingBottom: 4,
    marginBottom: 24,
  },
  dealCard: {
    width: 180,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dealTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dealIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dealBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dealTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  dealPlatformName: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── How It Works ────────────────────
  howItWorksContainer: {
    gap: 10,
    marginBottom: 22,
  },
  howStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  stepNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },

  // ── Connected Strip ─────────────────
  connectedStrip: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  connectedStripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  connectedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  connectedLogos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  connectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  connectedChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ─── Instant Price Analyzer Box ─────
  analyzerBox: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  analyzerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  analyzerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  liveDbTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  liveDbText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  analyzerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 16,
  },
  analyzerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzerInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    marginRight: 8,
  },
  analyzerButton: {
    height: 42,
    paddingHorizontal: 16,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzerButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
