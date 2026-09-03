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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../theme';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { searchHistoryApi, SearchHistoryItem } from '../services/productApi';
import { MainTabScreenProps } from '../navigation/types';

// Supported retailer definitions for real-time URL detection
const SUPPORTED_RETAILERS = [
  {
    name: 'Amazon',
    slug: 'amazon',
    icon: 'shopping-cart' as const,
    color: '#FF9900',
    domains: ['amazon.in', 'amazon.com', 'amzn.to', 'amzn.in'],
    sampleUrl: 'https://www.amazon.in/dp/B09XS7JWHH',
  },
  {
    name: 'Flipkart',
    slug: 'flipkart',
    icon: 'storefront' as const,
    color: '#2874F0',
    domains: ['flipkart.com', 'dl.flipkart.com'],
    sampleUrl: 'https://www.flipkart.com/sony-wh-1000xm5-bluetooth-headset/p/itm12345',
  },
  {
    name: 'Croma',
    slug: 'croma',
    icon: 'devices' as const,
    color: '#00B5B8',
    domains: ['croma.com'],
    sampleUrl: 'https://www.croma.com/sony-wh-1000xm5-headphones/p/250000',
  },
];

// Fallback benchmark searches if user has no search history yet
const DEFAULT_SAMPLE_SEARCHES: SearchHistoryItem[] = [
  {
    id: 's1',
    title: 'Sony WH-1000XM5',
    category: 'Headphones',
    retailer: 'Amazon',
    brand: 'Sony',
    lowestPrice: 24999,
    url: 'https://www.amazon.in/dp/B09XS7JWHH',
    searchedAt: new Date().toISOString(),
  },
  {
    id: 's2',
    title: 'Apple iPhone 17 256GB',
    category: 'Smartphones',
    retailer: 'Flipkart',
    brand: 'Apple',
    lowestPrice: 79999,
    url: 'https://www.flipkart.com/apple-iphone-17-256gb/p/itmiphone17',
    searchedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 's3',
    title: 'MacBook Air M3 (16GB)',
    category: 'Laptops',
    retailer: 'Croma',
    brand: 'Apple',
    lowestPrice: 114900,
    url: 'https://www.croma.com/macbook-air-m3-16gb/p/260000',
    searchedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 's4',
    title: 'Samsung 65" 4K OLED TV',
    category: 'Smart TVs',
    retailer: 'Amazon',
    brand: 'Samsung',
    lowestPrice: 144990,
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
    title: 'Paste link',
    desc: 'Copy any product URL from Amazon, Flipkart, or Croma.',
    icon: 'content-paste' as const,
  },
  {
    step: '2',
    title: 'Compare prices',
    desc: 'We audit live prices across all authorized stores in real time.',
    icon: 'compare-arrows' as const,
  },
  {
    step: '3',
    title: 'Buy smarter',
    desc: 'Jump directly to the lowest verified price and set price alerts.',
    icon: 'savings' as const,
  },
];

export const HomeScreen: React.FC<MainTabScreenProps<'Home'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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

    // 1. Empty input validation
    if (!trimmed) {
      return { valid: false, error: 'Please enter or paste a product URL to compare prices.' };
    }

    // 2. Invalid URL format validation
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

    // 3. Unsupported retailer validation
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

    // Save to user search history asynchronously
    searchHistoryApi.recordSearch({
      title: detectedRetailer ? `${detectedRetailer.name} Product` : 'Product Search',
      url: validation.cleanUrl!,
      retailer: detectedRetailer?.name || 'Amazon',
    }).catch(() => {});

    // Navigate to AnalyzeProduct
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ---------------------------------------------------- */}
          {/* 1. HL² BRANDING & HERO */}
          {/* ---------------------------------------------------- */}
          <View style={styles.brandHero}>
            <View style={styles.badgeRow}>
              <View style={styles.brandLogoBadge}>
                <Text style={styles.brandLogoText}>HL²</Text>
              </View>
              <View style={styles.versionPill}>
                <View style={styles.livePulse} />
                <Text style={styles.versionText}>Real-Time Price Intelligence</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Find the best price</Text>
            <Text style={styles.heroSubtitle}>
              Never overpay. Paste any product link from Amazon, Flipkart, or Croma to instantly audit prices and savings.
            </Text>
          </View>

          {/* ---------------------------------------------------- */}
          {/* 2. LARGE PRODUCT URL INPUT CARD */}
          {/* ---------------------------------------------------- */}
          <Card variant="glass" style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <View style={styles.inputHeaderLeft}>
                <GoogleIcon name="link" size={18} color={colors.brand.primaryGlow} style={{ marginRight: 6 }} />
                <Text style={styles.inputCardTitle}>Product URL</Text>
              </View>

              {detectedRetailer ? (
                <View style={[styles.detectedBadge, { borderColor: detectedRetailer.color }]}>
                  <GoogleIcon name={detectedRetailer.icon} size={13} color={detectedRetailer.color} style={{ marginRight: 4 }} />
                  <Text style={[styles.detectedText, { color: detectedRetailer.color }]}>
                    {detectedRetailer.name}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Input Box with Clear & Submit Action */}
            <View style={[styles.textInputWrapper, errorMessage ? styles.inputErrorBorder : null]}>
              <TextInput
                style={styles.textInput}
                placeholder="Paste product link (e.g., https://amazon.in/dp/...)"
                placeholderTextColor={colors.text.muted}
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
                clearButtonMode="while-editing"
              />

              {urlInput.length > 0 && Platform.OS !== 'ios' ? (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => {
                    setUrlInput('');
                    setErrorMessage(null);
                  }}
                >
                  <GoogleIcon name="cancel" size={18} color={colors.text.muted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Validation Error Message */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <GoogleIcon name="error-outline" size={16} color={colors.status.error} style={{ marginRight: 6 }} />
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
                    <GoogleIcon name={ret.icon} size={12} color={ret.color} style={{ marginRight: 4 }} />
                    <Text style={styles.sampleChipText}>{ret.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Primary Action Button: [Analyze Price] */}
            <Button
              title="Analyze Price"
              icon="search"
              size="lg"
              variant="primary"
              loading={isAnalyzing}
              onPress={handleAnalyze}
              style={styles.analyzeButton}
            />
          </Card>

          {/* ---------------------------------------------------- */}
          {/* 3. HOW HL² WORKS (1-2-3 ROADMAP) */}
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
                    <GoogleIcon name={item.icon} size={16} color={colors.brand.primaryGlow} style={{ marginRight: 4 }} />
                    <Text style={styles.stepTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.stepDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ---------------------------------------------------- */}
          {/* 4. RECENT SEARCHES */}
          {/* ---------------------------------------------------- */}
          {recentSearches.length > 0 ? (
            <>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <GoogleIcon name="history" size={18} color={colors.brand.primaryGlow} style={{ marginRight: 6 }} />
                  <Text style={styles.sectionHeadingNoMargin}>Recent Searches</Text>
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
                    activeOpacity={0.8}
                    onPress={() => {
                      setUrlInput(item.url);
                      navigation.navigate('AnalyzeProduct', { initialUrl: item.url });
                    }}
                  >
                    <View style={styles.recentBadgeRow}>
                      <Text style={styles.recentStore}>{item.retailer}</Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveSearchItem(item.id);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <GoogleIcon name="close" size={14} color={colors.text.muted} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.recentTitle} numberOfLines={2}>
                      {item.title}
                    </Text>

                    <View style={styles.recentFooter}>
                      <Text style={styles.recentPrice}>
                        {typeof item.lowestPrice === 'number' && item.lowestPrice > 0
                          ? `₹${item.lowestPrice.toLocaleString('en-IN')}`
                          : 'View Deal'}
                      </Text>
                      <GoogleIcon name="arrow-forward" size={14} color={colors.brand.primaryGlow} />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          ) : null}

          {/* ---------------------------------------------------- */}
          {/* 5. POPULAR CATEGORIES */}
          {/* ---------------------------------------------------- */}
          <Text style={styles.sectionHeading}>Popular Categories</Text>
          <View style={styles.categoryGrid}>
            {POPULAR_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ProductComparison', { category: cat.name })}
              >
                <View style={styles.categoryIconCircle}>
                  <GoogleIcon name={cat.icon} size={20} color={colors.brand.primaryGlow} />
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
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  brandHero: {
    marginBottom: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  brandLogoBadge: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  brandLogoText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.sm,
    letterSpacing: 0.5,
  },
  versionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border.brand,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.status.success,
    marginRight: 6,
  },
  versionText: {
    color: colors.brand.primaryGlow,
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.medium,
  },
  heroTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  inputCard: {
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.brand,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  inputHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputCardTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
  detectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  detectedText: {
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.bold,
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: radii.md,
    borderColor: colors.border.default,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md - 2 : spacing.xs,
    marginBottom: spacing.sm,
  },
  inputErrorBorder: {
    borderColor: colors.status.error,
  },
  textInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSizes.sm,
    padding: 0,
  },
  clearBtn: {
    padding: spacing.xs,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: colors.status.error,
    fontSize: typography.fontSizes.xs,
    flex: 1,
    lineHeight: 16,
  },
  quickSamplesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  quickSampleLabel: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.muted,
    marginRight: spacing.xs,
  },
  sampleScroll: {
    gap: spacing.xs,
  },
  sampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderColor: colors.border.default,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  sampleChipText: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.secondary,
    fontWeight: typography.fontWeights.medium,
  },
  analyzeButton: {
    marginTop: spacing.xs,
  },
  sectionHeading: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm + 2,
  },
  sectionHeadingNoMargin: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
    marginTop: spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearHistoryLink: {
    color: colors.status.error,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  howItWorksGrid: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  howStepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: colors.brand.primaryGlow,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    color: colors.brand.primaryGlow,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
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
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  stepDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  recentScrollContainer: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  recentCard: {
    width: 210,
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  recentBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recentStore: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.brand.primaryGlow,
    fontWeight: typography.fontWeights.semibold,
    textTransform: 'uppercase',
  },
  recentPrice: {
    fontSize: typography.fontSizes.xs,
    color: colors.status.success,
    fontWeight: typography.fontWeights.bold,
  },
  recentTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  recentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: spacing.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  categoryName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.muted,
    marginTop: 2,
  },
});
