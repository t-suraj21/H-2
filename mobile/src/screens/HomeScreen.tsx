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
import {
  productApi,
  watchlistApi,
  alertApi,
  ProductSearchResultData,
  ProductSearchPlatform,
} from '../services/productApi';
import { MainTabScreenProps } from '../navigation/types';
import { openStoreApp } from '../utils/platformLauncher';

const POPULAR_SEARCHES = [
  'iPhone 16 Pro',
  'Sony WH-1000XM5',
  'MacBook Air M3',
  'Nike Air Max',
  'AirPods Pro 2',
  'Samsung S24 Ultra',
  'boAt Earbuds',
  'Men Cotton Shirt',
  'Silk Saree',
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;

// ─── Real Shopping Platforms ──────────────────────────────────────────
interface ShoppingPlatform {
  id: string;
  name: string;
  tagline: string;
  url: string;
  ordersUrl: string;
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
    ordersUrl: 'https://www.amazon.in/gp/css/order-history',
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
    ordersUrl: 'https://www.flipkart.com/account/orders',
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
    ordersUrl: 'https://www.meesho.com/orders',
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
    ordersUrl: 'https://www.myntra.com/my/orders',
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
    screen: 'Products',
  },
  {
    id: 'orders',
    label: 'Track Orders',
    icon: 'local-shipping',
    color: '#0284C7',
    bgColor: '#F0F9FF',
    screen: 'Profile',
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
  const [searchResults, setSearchResults] = useState<ProductSearchResultData | null>(null);
  const [activeQuery, setActiveQuery] = useState('');
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
    async (platform: ShoppingPlatform, isOrders: boolean = false) => {
      try {
        await openStoreApp({
          platformId: platform.id,
          isOrders,
          navigation,
        });
      } catch {
        navigation.navigate('ShoppingWebView', {
          platformName: isOrders ? `${platform.name} Orders` : platform.name,
          url: isOrders ? platform.ordersUrl : platform.url,
          color: platform.color,
          platformId: platform.id,
        });
      }
    },
    [navigation]
  );

  const handleOpenDeal = useCallback(
    async (deal: FeaturedDeal) => {
      const platformKey = deal.platform.toLowerCase().includes('flipkart')
        ? 'flipkart'
        : deal.platform.toLowerCase().includes('myntra')
        ? 'myntra'
        : deal.platform.toLowerCase().includes('meesho')
        ? 'meesho'
        : 'amazon';

      try {
        await openStoreApp({
          platformId: platformKey,
          customUrl: deal.url,
          navigation,
        });
      } catch {
        navigation.navigate('ShoppingWebView', {
          platformName: deal.platform,
          url: deal.url,
          color: deal.platformColor,
          platformId: platformKey,
        });
      }
    },
    [navigation]
  );

  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      if (action.screen === 'Products') {
        navigation.navigate('Products');
      } else if (action.screen === 'Watchlist') {
        navigation.navigate('Watchlist');
      } else if (action.screen === 'Alerts') {
        navigation.navigate('Alerts');
      } else if (action.id === 'orders' || action.screen === 'Profile') {
        navigation.navigate('Profile');
      } else if (action.id === 'history') {
        navigation.navigate('Products');
      }
    },
    [navigation]
  );

  const handleProductSearch = async (overrideTerm?: string) => {
    const rawTerm = (overrideTerm !== undefined ? overrideTerm : searchUrl).trim();
    if (!rawTerm) {
      Alert.alert(
        'Search Any Product',
        'Enter any product name (e.g. iPhone 15, Nike Shoes, MacBook) or paste a product link to find it across all stores.'
      );
      return;
    }

    if (overrideTerm) {
      setSearchUrl(overrideTerm);
    }

    // 1. If it's a URL, analyze with backend URL crawler
    if (rawTerm.startsWith('http://') || rawTerm.startsWith('https://')) {
      setIsAnalyzing(true);
      try {
        const res = await productApi.analyzeUrl(rawTerm);
        if (res.success && res.data) {
          setSearchUrl('');
          setSearchResults(null);
          navigation.navigate('Products');
        } else {
          Alert.alert(
            'Analysis Notice',
            res.message || 'Could not auto-verify URL. Opening comparison tool...'
          );
          navigation.navigate('Products');
        }
      } catch {
        navigation.navigate('Products');
      } finally {
        setIsAnalyzing(false);
      }
      return;
    }

    // 2. It's a product search query! Find across all shopping apps!
    setIsAnalyzing(true);
    try {
      const res = await productApi.searchProductAcrossStores(rawTerm);
      if (res.success && res.data) {
        setSearchResults(res.data);
        setActiveQuery(rawTerm);
      } else {
        Alert.alert('Search Notice', res.message || 'Could not retrieve store list.');
      }
    } catch {
      Alert.alert('Network Error', 'Could not complete multi-store search.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenStoreResult = async (platform: ProductSearchPlatform) => {
    try {
      await openStoreApp({
        platformId: platform.id,
        customUrl: platform.searchUrl,
        navigation,
      });
    } catch {
      navigation.navigate('ShoppingWebView', {
        platformName: platform.name,
        url: platform.searchUrl,
        color: platform.color,
        platformId: platform.id,
      });
    }
  };

  const handleCompareAllStores = (query: string, category?: string) => {
    navigation.navigate('ProductComparison', {
      title: query,
      category: category || 'Multi-Store Marketplace',
    });
  };

  const handleClearSearchResults = () => {
    setSearchResults(null);
    setActiveQuery('');
    setSearchUrl('');
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

        {/* ─── Universal Product Search & Store Accessibility Hub ─── */}
        <View style={styles.analyzerBox}>
          <View style={styles.analyzerTitleRow}>
            <GoogleIcon name="manage-search" size={20} color="#2563EB" style={{ marginRight: 6 }} />
            <Text style={styles.analyzerTitle}>Universal Product Search</Text>
            <View style={styles.liveDbTag}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.liveDbText}>All Stores</Text>
            </View>
          </View>
          <Text style={styles.analyzerSubtitle}>
            Search any product to access it across Amazon, Flipkart, Myntra, Meesho & Croma
          </Text>

          <View style={styles.analyzerInputRow}>
            <TextInput
              style={styles.analyzerInput}
              value={searchUrl}
              onChangeText={setSearchUrl}
              placeholder="Search product or link (e.g. iPhone 15, Nike...)"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => handleProductSearch()}
            />
            {searchUrl.length > 0 ? (
              <TouchableOpacity
                style={styles.clearInputButton}
                onPress={() => setSearchUrl('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <GoogleIcon name="close" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.analyzerButton}
              onPress={() => handleProductSearch()}
              disabled={isAnalyzing}
              activeOpacity={0.8}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <GoogleIcon name="search" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.analyzerButtonText}>Find</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Suggestion Pills */}
          <View style={styles.suggestionSection}>
            <Text style={styles.suggestionLabel}>Popular Searches:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionRow}
            >
              {POPULAR_SEARCHES.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={styles.suggestionChip}
                  onPress={() => handleProductSearch(term)}
                  activeOpacity={0.75}
                >
                  <GoogleIcon name="trending-up" size={12} color="#2563EB" style={{ marginRight: 4 }} />
                  <Text style={styles.suggestionChipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ─── LIVE MULTI-STORE AVAILABILITY RESULTS ─── */}
          {searchResults && (
            <View style={styles.multiStoreResultsCard}>
              <View style={styles.resultsHeaderRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.resultsBadgeRow}>
                    <View style={styles.availablePulseDot} />
                    <Text style={styles.resultsAvailableBadge}>
                      AVAILABLE ON {searchResults.platforms.length} SHOPPING APPS
                    </Text>
                  </View>
                  <Text style={styles.resultsQueryTitle} numberOfLines={1}>
                    "{activeQuery}"
                  </Text>
                  <Text style={styles.resultsCategoryText}>
                    Category: {searchResults.category} • Tap any store to open & auto-fill
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeResultsBtn}
                  onPress={handleClearSearchResults}
                  activeOpacity={0.7}
                >
                  <GoogleIcon name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Master 5-Store Comparison CTA */}
              <TouchableOpacity
                style={styles.masterCompareBtn}
                onPress={() => handleCompareAllStores(activeQuery, searchResults.category)}
                activeOpacity={0.85}
              >
                <GoogleIcon name="compare-arrows" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.masterCompareBtnText}>
                  Compare Prices & Deals Across All 5 Stores
                </Text>
                <GoogleIcon name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
              </TouchableOpacity>

              {/* Store List */}
              <View style={styles.storeResultsList}>
                {searchResults.platforms.map((platform) => (
                  <TouchableOpacity
                    key={platform.id}
                    style={[styles.storeResultItem, { borderLeftColor: platform.color }]}
                    onPress={() => handleOpenStoreResult(platform)}
                    activeOpacity={0.82}
                  >
                    <View style={[styles.storeResultIconBox, { backgroundColor: `${platform.color}15` }]}>
                      <GoogleIcon name={platform.icon as GoogleIconName} size={20} color={platform.color} />
                    </View>
                    <View style={styles.storeResultInfo}>
                      <View style={styles.storeResultTitleRow}>
                        <Text style={styles.storeResultName}>{platform.name}</Text>
                        <View style={[styles.storeResultTag, { backgroundColor: `${platform.color}18` }]}>
                          <Text style={[styles.storeResultTagText, { color: platform.color }]}>
                            {platform.badge}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.storeResultTagline} numberOfLines={1}>
                        {platform.tagline}
                      </Text>
                      <View style={styles.storeFeaturePillsRow}>
                        {platform.features.map((feat, idx) => (
                          <View key={idx} style={styles.featurePill}>
                            <Text style={styles.featurePillText}>{feat}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={[styles.storeOpenButton, { backgroundColor: platform.color }]}>
                      <Text style={styles.storeOpenButtonText}>Open</Text>
                      <GoogleIcon name="open-in-new" size={13} color="#FFFFFF" style={{ marginLeft: 3 }} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
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

              {/* Card Action Buttons: Shop & Track Orders */}
              <View style={styles.cardActionRow}>
                <TouchableOpacity
                  style={[styles.openStoreBtn, { backgroundColor: platform.color }]}
                  onPress={() => handleOpenPlatform(platform, false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.openStoreBtnText}>Shop</Text>
                  <GoogleIcon name="open-in-new" size={12} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.trackOrderBtn, { borderColor: platform.color + '50' }]}
                  onPress={() => handleOpenPlatform(platform, true)}
                  activeOpacity={0.8}
                >
                  <GoogleIcon name="local-shipping" size={12} color={platform.color} />
                  <Text style={[styles.trackOrderBtnText, { color: platform.color }]}>Orders</Text>
                </TouchableOpacity>
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
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openStoreBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    borderRadius: 17,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  openStoreBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  trackOrderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    borderRadius: 17,
    borderWidth: 1.2,
    backgroundColor: '#FFFFFF',
    gap: 3,
  },
  trackOrderBtnText: {
    fontSize: 10,
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
  clearInputButton: {
    padding: 6,
    marginRight: 6,
  },

  // ─── Suggestion Section ─────────────
  suggestionSection: {
    marginTop: 10,
    marginBottom: 4,
  },
  suggestionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },

  // ─── Multi-Store Availability Hub ───
  multiStoreResultsCard: {
    marginTop: 14,
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultsBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  availablePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  resultsAvailableBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.6,
  },
  resultsQueryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  resultsCategoryText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  closeResultsBtn: {
    padding: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  masterCompareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  masterCompareBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  storeResultsList: {
    gap: 10,
  },
  storeResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    padding: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  storeResultIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  storeResultInfo: {
    flex: 1,
  },
  storeResultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  storeResultName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 6,
  },
  storeResultTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  storeResultTagText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  storeResultTagline: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  storeFeaturePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  featurePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  featurePillText: {
    fontSize: 9,
    color: '#475569',
    fontWeight: '600',
  },
  storeOpenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    marginLeft: 8,
  },
  storeOpenButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
