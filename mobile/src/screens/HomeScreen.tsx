import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../theme';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { searchHistoryApi, SearchHistoryItem } from '../services/productApi';
import { useAuth } from '../context/AuthContext';
import { MainTabScreenProps } from '../navigation/types';

// Supported retailer definitions for real-time URL detection
const SUPPORTED_RETAILERS = [
  {
    name: 'Amazon',
    slug: 'amazon',
    icon: 'shopping-cart' as const,
    color: '#D97706',
    bgColor: '#FEF3C7',
    domains: ['amazon.in', 'amazon.com', 'amzn.to', 'amzn.in'],
    sampleUrl: 'https://www.amazon.in/dp/B09XS7JWHH',
  },
  {
    name: 'Flipkart',
    slug: 'flipkart',
    icon: 'storefront' as const,
    color: '#2563EB',
    bgColor: '#DBEAFE',
    domains: ['flipkart.com', 'dl.flipkart.com'],
    sampleUrl: 'https://www.flipkart.com/sony-wh-1000xm5-bluetooth-headset/p/itm12345',
  },
  {
    name: 'Croma',
    slug: 'croma',
    icon: 'devices' as const,
    color: '#0D9488',
    bgColor: '#CCFBF1',
    domains: ['croma.com'],
    sampleUrl: 'https://www.croma.com/sony-wh-1000xm5-headphones/p/250000',
  },
];

// Fallback benchmark searches if user has no search history yet
const DEFAULT_SAMPLE_SEARCHES: SearchHistoryItem[] = [
  {
    id: 's1',
    title: 'Sony WH-1000XM5 Wireless Headphones',
    category: 'Headphones',
    retailer: 'Amazon',
    brand: 'Sony',
    lowestPrice: 24999,
    url: 'https://www.amazon.in/dp/B09XS7JWHH',
    searchedAt: new Date().toISOString(),
  },
  {
    id: 's2',
    title: 'Apple iPhone 16 128GB Teal',
    category: 'Smartphones',
    retailer: 'Flipkart',
    brand: 'Apple',
    lowestPrice: 74999,
    url: 'https://www.flipkart.com/apple-iphone-16-128gb/p/itmiphone16',
    searchedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 's3',
    title: 'MacBook Air M3 (16GB RAM, 512GB)',
    category: 'Laptops',
    retailer: 'Croma',
    brand: 'Apple',
    lowestPrice: 114900,
    url: 'https://www.croma.com/macbook-air-m3-16gb/p/260000',
    searchedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 's4',
    title: 'Samsung 65" 4K Crystal UHD Smart TV',
    category: 'Smart TVs',
    retailer: 'Amazon',
    brand: 'Samsung',
    lowestPrice: 62990,
    url: 'https://www.amazon.in/dp/B0CX234S90C',
    searchedAt: new Date(Date.now() - 10800000).toISOString(),
  },
];

// Popular Categories
const POPULAR_CATEGORIES = [
  { id: 'cat-audio', name: 'Audio & ANC', icon: 'headphones' as const, count: '1.2k deals' },
  { id: 'cat-phones', name: 'Smartphones', icon: 'smartphone' as const, count: '850 deals' },
  { id: 'cat-laptops', name: 'Laptops & PCs', icon: 'laptop-mac' as const, count: '640 deals' },
  { id: 'cat-tvs', name: 'Smart TVs', icon: 'tv' as const, count: '410 deals' },
  { id: 'cat-wearables', name: 'Smartwatches', icon: 'watch' as const, count: '520 deals' },
  { id: 'cat-gaming', name: 'Gaming Consoles', icon: 'videogame-asset' as const, count: '310 deals' },
];

// How HL² Works Steps
const HOW_IT_WORKS_STEPS = [
  {
    step: '1',
    title: 'Paste product link',
    desc: 'Copy any product URL from Amazon, Flipkart, or Croma.',
    icon: 'content-paste' as const,
  },
  {
    step: '2',
    title: 'Audit live prices',
    desc: 'HL² audits real-time pricing, stock status, and fake discount history.',
    icon: 'compare-arrows' as const,
  },
  {
    step: '3',
    title: 'Buy at real low',
    desc: 'Jump directly to the verified lowest store or set automated price drop alerts.',
    icon: 'savings' as const,
  },
];

export const HomeScreen: React.FC<MainTabScreenProps<'Home'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [urlInput, setUrlInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>(DEFAULT_SAMPLE_SEARCHES);

  // Load User Search History
  const loadSearchHistory = useCallback(async () => {
    try {
      const response = await searchHistoryApi.getRecentSearches(10);
      if (response.success && response.data && response.data.length > 0) {
        setRecentSearches(response.data);
      }
    } catch {
      // Fallback to defaults
    }
  }, []);

  useEffect(() => {
    loadSearchHistory();
  }, [loadSearchHistory]);

  // Real-time Retailer Detection
  const detectRetailer = useCallback((text: string) => {
    if (!text || !text.includes('.')) return null;
    const clean = text.toLowerCase();
    return (
      SUPPORTED_RETAILERS.find((r) => r.domains.some((d) => clean.includes(d))) || null
    );
  }, []);

  const detectedRetailer = detectRetailer(urlInput);

  // Validation logic
  const validateUrl = (rawUrl: string): { valid: boolean; error?: string; cleanUrl?: string } => {
    const trimmed = rawUrl.trim();

    if (!trimmed) {
      return { valid: false, error: 'Please enter or paste a product URL to compare prices.' };
    }

    let parsed: URL;
    try {
      const urlWithScheme = trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;
      parsed = new URL(urlWithScheme);
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        return { valid: false, error: 'Please enter a valid web URL (e.g. https://www.amazon.in/dp/...)' };
      }
    } catch {
      return { valid: false, error: 'Please enter a valid web URL (e.g. https://www.amazon.in/dp/...)' };
    }

    const hostname = parsed.hostname.toLowerCase();
    const isSupported = SUPPORTED_RETAILERS.some((r) =>
      r.domains.some((d) => hostname.includes(d))
    );

    if (!isSupported) {
      return {
        valid: false,
        error: 'HL² currently analyzes Amazon, Flipkart, and Croma products. More stores coming soon!',
      };
    }

    return { valid: true, cleanUrl: parsed.toString() };
  };

  const handleAnalyze = () => {
    Keyboard.dismiss();
    setErrorMessage(null);

    const validation = validateUrl(urlInput);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid product URL.');
      return;
    }

    setIsAnalyzing(true);

    searchHistoryApi.recordSearch({
      title: detectedRetailer ? `${detectedRetailer.name} Product` : 'Product Search',
      url: validation.cleanUrl!,
      retailer: detectedRetailer?.name || 'Amazon',
    }).catch(() => {});

    setTimeout(() => {
      setIsAnalyzing(false);
      navigation.navigate('AnalyzeProduct', { initialUrl: validation.cleanUrl });
    }, 200);
  };

  const handleSampleSelect = (sampleUrl: string) => {
    setUrlInput(sampleUrl);
    setErrorMessage(null);
  };

  const handleRemoveSearchItem = async (id: string) => {
    setRecentSearches((prev) => prev.filter((item) => item.id !== id));
    try {
      await searchHistoryApi.removeSearchItem(id);
    } catch {
      // Ignored
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Search History',
      'Are you sure you want to clear your recent product searches?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setRecentSearches([]);
            try {
              await searchHistoryApi.clearSearchHistory();
            } catch {
              // Ignored
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
        <ScrollView
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 95 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ---------------------------------------------------- */}
          {/* 1. HL² TOP BAR & BRAND HERO */}
          {/* ---------------------------------------------------- */}
          <View style={styles.topHeader}>
            <View style={styles.topHeaderLeft}>
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>HL</Text>
                <Text style={styles.brandBadgeSup}>²</Text>
              </View>
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>
                  {user?.name ? `Hello, ${user.name.split(' ')[0]} 👋` : 'Welcome to HL² 👋'}
                </Text>
                <View style={styles.livePulseRow}>
                  <View style={styles.livePulse} />
                  <Text style={styles.livePulseText}>Real-Time Price Intelligence</Text>
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

          {/* Hero Banner Intro */}
          <View style={styles.heroIntro}>
            <Text style={styles.heroTitle}>Compare. Analyze. Buy Smarter.</Text>
            <Text style={styles.heroSubtitle}>
              Paste any product URL from Amazon, Flipkart, or Croma to reveal true cross-store price history & deal authenticity.
            </Text>
          </View>

          {/* ---------------------------------------------------- */}
          {/* 2. LARGE PRODUCT URL INPUT CARD */}
          {/* ---------------------------------------------------- */}
            <View style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <View style={styles.inputHeaderLeft}>
                <GoogleIcon name="link" size={18} color="#2563EB" style={{ marginRight: 6 }} />
                <Text style={styles.inputCardTitle}>Analyze Product URL</Text>
              </View>

              {detectedRetailer ? (
                <View style={[styles.detectedBadge, { backgroundColor: detectedRetailer.bgColor, borderColor: detectedRetailer.color }]}>
                  <GoogleIcon name={detectedRetailer.icon} size={13} color={detectedRetailer.color} style={{ marginRight: 4 }} />
                  <Text style={[styles.detectedText, { color: detectedRetailer.color }]}>
                    {detectedRetailer.name}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Input Box */}
            <View style={[styles.textInputWrapper, errorMessage ? styles.inputErrorBorder : null]}>
              <TextInput
                style={styles.textInput}
                placeholder="Paste product link (Amazon, Flipkart, Croma)..."
                placeholderTextColor="#94A3B8"
                value={urlInput}
                onChangeText={(text) => {
                  setUrlInput(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleAnalyze}
              />

              {urlInput.length > 0 ? (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => {
                    setUrlInput('');
                    setErrorMessage(null);
                  }}
                >
                  <GoogleIcon name="cancel" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Validation Error Message */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <GoogleIcon name="error-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Quick Sample Paste Shortcuts */}
            <View style={styles.quickSamplesRow}>
              <Text style={styles.quickSampleLabel}>Quick Samples:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sampleScroll}>
                {SUPPORTED_RETAILERS.map((ret) => (
                  <TouchableOpacity
                    key={ret.slug}
                    style={styles.sampleChip}
                    onPress={() => handleSampleSelect(ret.sampleUrl)}
                    activeOpacity={0.7}
                  >
                    <GoogleIcon name={ret.icon} size={13} color={ret.color} style={{ marginRight: 5 }} />
                    <Text style={styles.sampleChipText}>{ret.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Primary Action Button: [Analyze Price] */}
            <TouchableOpacity
              style={styles.analyzeBtn}
              onPress={handleAnalyze}
              disabled={isAnalyzing}
              activeOpacity={0.88}
            >
              <View style={styles.analyzeBtnInner}>
                <GoogleIcon name="search" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.analyzeBtnText}>
                  {isAnalyzing ? 'Analyzing Real-Time Prices...' : 'Analyze Price & Deals'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ---------------------------------------------------- */}
          {/* 3. SUPPORTED STORES STRIP */}
          {/* ---------------------------------------------------- */}
          <View style={styles.supportedStrip}>
            <Text style={styles.supportedLabel}>Supported Stores:</Text>
            <View style={styles.storesRow}>
              {SUPPORTED_RETAILERS.map((store) => (
                <View key={store.slug} style={styles.storeBadge}>
                  <GoogleIcon name={store.icon} size={14} color={store.color} style={{ marginRight: 5 }} />
                  <Text style={styles.storeBadgeText}>{store.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ---------------------------------------------------- */}
          {/* 4. HOW HL² WORKS (1-2-3 ROADMAP) */}
          {/* ---------------------------------------------------- */}
          <Text style={styles.sectionHeading}>How HL² Works</Text>
          <View style={styles.howItWorksGrid}>
            {HOW_IT_WORKS_STEPS.map((item) => (
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

          {/* ---------------------------------------------------- */}
          {/* 5. RECENT SEARCHES */}
          {/* ---------------------------------------------------- */}
          {recentSearches.length > 0 ? (
            <>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <GoogleIcon name="history" size={18} color="#0F172A" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionHeadingNoMargin}>Recent Audits</Text>
                </View>
                <TouchableOpacity onPress={handleClearHistory}>
                  <Text style={styles.clearHistoryLink}>Clear All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentScrollContainer}
              >
                {recentSearches.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.recentCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      setUrlInput(item.url);
                      navigation.navigate('AnalyzeProduct', { initialUrl: item.url });
                    }}
                  >
                    <View style={styles.recentBadgeRow}>
                      <View style={styles.retailerPill}>
                        <Text style={styles.recentStore}>{item.retailer}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveSearchItem(item.id);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <GoogleIcon name="close" size={14} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.recentTitle} numberOfLines={2}>
                      {item.title}
                    </Text>

                    <View style={styles.recentFooter}>
                      <Text style={styles.recentPrice}>
                        {typeof item.lowestPrice === 'number' && item.lowestPrice > 0
                          ? `₹${item.lowestPrice.toLocaleString('en-IN')}`
                          : 'Audit Deal'}
                      </Text>
                      <View style={styles.auditNowRow}>
                        <Text style={styles.auditNowText}>View</Text>
                        <GoogleIcon name="arrow-forward" size={13} color="#2563EB" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          ) : null}

          {/* ---------------------------------------------------- */}
          {/* 6. POPULAR CATEGORIES */}
          {/* ---------------------------------------------------- */}
          <Text style={styles.sectionHeading}>Browse Popular Categories</Text>
          <View style={styles.categoryGrid}>
            {POPULAR_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                activeOpacity={0.8}
                onPress={() => {
                  setUrlInput(`https://www.amazon.in/s?k=${encodeURIComponent(cat.name)}`);
                }}
              >
                <View style={styles.categoryIconCircle}>
                  <GoogleIcon name={cat.icon} size={22} color="#0F172A" />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryCount}>{cat.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
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
    backgroundColor: '#2563EB',
    marginRight: 6,
  },
  livePulseText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
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
  heroIntro: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  detectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
  },
  detectedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  clearBtn: {
    padding: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    flex: 1,
  },
  quickSamplesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 14,
  },
  quickSampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 8,
  },
  sampleScroll: {
    gap: 8,
  },
  sampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  sampleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  analyzeBtn: {
    backgroundColor: '#0F172A',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  analyzeBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  supportedStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  supportedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  storesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  storeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  howItWorksGrid: {
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeadingNoMargin: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  clearHistoryLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  recentScrollContainer: {
    gap: 12,
    paddingBottom: 4,
    marginBottom: 22,
  },
  recentCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recentBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  retailerPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recentStore: {
    fontSize: 10,
    color: '#0F172A',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
    lineHeight: 18,
    minHeight: 36,
  },
  recentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  recentPrice: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '800',
  },
  auditNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auditNowText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    marginRight: 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
