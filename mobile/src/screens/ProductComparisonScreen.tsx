import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../theme';
import { HeaderBar } from '../components/common/HeaderBar';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { productApi, ComparisonResultData, RetailerOffer } from '../services/productApi';
import { RootStackScreenProps } from '../navigation/types';

// Helper to format relative time
const formatTimeAgo = (timestamp?: string) => {
  if (!timestamp) return 'Just now';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `Checked ${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Checked ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `Checked ${diffDays}d ago`;
};

// Helper to format currency symbol and amount
const formatPrice = (price: number, currency: string = 'INR') => {
  const symbol = currency === 'INR' || currency === '₹' ? '₹' : '$';
  return `${symbol}${price.toLocaleString('en-IN')}`;
};

export const ProductComparisonScreen: React.FC<RootStackScreenProps<'ProductComparison'>> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonResultData | null>(null);

  // Initial mock data if no direct payload was passed
  const initialProduct = {
    title: route.params?.title || 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    brand: 'Sony',
    model: 'WH-1000XM5',
    category: route.params?.category || 'Headphones & Audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
  };

  const initialOffers = [
    {
      retailer: 'Amazon',
      retailerSlug: 'amazon',
      title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones - Black',
      price: 24999,
      mrp: 29990,
      deliveryFee: 0,
      effectivePrice: 24999,
      currency: 'INR',
      url: 'https://www.amazon.in/dp/B09XS7JWHH',
      availability: true,
      status: 'VERIFIED' as const,
      seller: { name: 'Appario Retail (Authorized)', isAuthorized: true },
      lastChecked: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      retailer: 'Flipkart',
      retailerSlug: 'flipkart',
      title: 'SONY WH-1000XM5 Bluetooth Headset (Black)',
      price: 25499,
      mrp: 29990,
      deliveryFee: 0,
      effectivePrice: 25499,
      currency: 'INR',
      url: 'https://www.flipkart.com/sony-wh-1000xm5/p/itm123',
      availability: true,
      status: 'VERIFIED' as const,
      seller: { name: 'SuperComNet (Authorized)', isAuthorized: true },
      lastChecked: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      retailer: 'Croma',
      retailerSlug: 'croma',
      title: 'Sony WH-1000XM5 Over-Ear Active Noise Cancellation Headphones',
      price: 26999,
      mrp: 29990,
      deliveryFee: 0,
      effectivePrice: 26999,
      currency: 'INR',
      url: 'https://www.croma.com/p/264332',
      availability: true,
      status: 'VERIFIED' as const,
      seller: { name: 'Croma Official Retail', isAuthorized: true },
      lastChecked: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
    {
      retailer: 'Reliance Digital',
      retailerSlug: 'reliance',
      title: 'Sony WH-1000XM5 ANC Headphones',
      price: 27999,
      mrp: 29990,
      deliveryFee: 99,
      effectivePrice: 28098,
      currency: 'INR',
      url: 'https://www.reliancedigital.in/sony-wh1000xm5',
      availability: false,
      status: 'UNAVAILABLE' as const,
      seller: { name: 'Reliance Retail', isAuthorized: true },
      lastChecked: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const fetchComparisonData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      // If initialData is passed through navigation
      const productPayload = route.params?.initialData?.product || initialProduct;
      const offersPayload = route.params?.initialData?.offers || initialOffers;

      const response = await productApi.compareOffers(productPayload, offersPayload);

      if (response.success && response.data) {
        setComparisonData(response.data);
      } else {
        setErrorMessage(response.message || 'Unable to retrieve comparison matrix.');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Network error while loading comparison offers.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [route.params]);

  useEffect(() => {
    fetchComparisonData();
  }, [fetchComparisonData]);

  // Handle external Buy Now link safely
  const handleBuyNow = async (url?: string, retailer?: string) => {
    if (!url) {
      Alert.alert('Link Unavailable', `Official store link for ${retailer} is not available.`);
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to Open Link', `Your device could not open the external store URL: ${url}`);
      }
    } catch {
      Alert.alert('Error', `Failed to open ${retailer || 'retailer'} website.`);
    }
  };

  const hasStalePrice = comparisonData?.offers.some((o) => o.status === 'STALE');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderBar
        title="Product Comparison"
        subtitle="Multi-Store Real-Time Price Audit"
      />

      {/* ---------------------------------------------------- */}
      {/* 1. LOADING STATE */}
      {/* ---------------------------------------------------- */}
      {loading && !refreshing ? (
        <View style={styles.stateCenterContainer}>
          <ActivityIndicator size="large" color={colors.brand.primaryGlow} />
          <Text style={styles.loadingTitle}>Auditing Live Retailer Offers</Text>
          <Text style={styles.loadingSubtitle}>
            Scanning Amazon, Flipkart, Croma, and authorized partners for authentic pricing...
          </Text>
        </View>
      ) : null}

      {/* ---------------------------------------------------- */}
      {/* 2. ERROR STATE */}
      {/* ---------------------------------------------------- */}
      {!loading && errorMessage ? (
        <View style={styles.stateCenterContainer}>
          <Card variant="glass" style={styles.errorCard}>
            <GoogleIcon name="error-outline" size={40} color={colors.status.error} style={{ marginBottom: spacing.sm }} />
            <Text style={styles.errorCardTitle}>Comparison Failed</Text>
            <Text style={styles.errorCardMessage}>{errorMessage}</Text>
            <Button
              title="Retry Price Audit"
              icon="refresh"
              variant="primary"
              onPress={() => fetchComparisonData()}
              style={styles.retryBtn}
            />
          </Card>
        </View>
      ) : null}

      {/* ---------------------------------------------------- */}
      {/* 3. NO-RESULTS / EMPTY STATE */}
      {/* ---------------------------------------------------- */}
      {!loading && !errorMessage && (!comparisonData || comparisonData.offers.length === 0) ? (
        <View style={styles.stateCenterContainer}>
          <Card variant="glass" style={styles.emptyCard}>
            <GoogleIcon name="search-off" size={44} color={colors.text.muted} style={{ marginBottom: spacing.sm }} />
            <Text style={styles.emptyTitle}>No Offers Found</Text>
            <Text style={styles.emptySubtitle}>
              We couldn't find active retailer listings for this product. Try analyzing a direct product link.
            </Text>
            <Button
              title="Analyze a Product URL"
              icon="link"
              variant="primary"
              onPress={() => navigation.navigate('AnalyzeProduct')}
              style={styles.retryBtn}
            />
          </Card>
        </View>
      ) : null}

      {/* ---------------------------------------------------- */}
      {/* 4. SUCCESS CONTENT & STALE STATE */}
      {/* ---------------------------------------------------- */}
      {!loading && !errorMessage && comparisonData && comparisonData.offers.length > 0 ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchComparisonData(true)}
              tintColor={colors.brand.primaryGlow}
              colors={[colors.brand.primary]}
            />
          }
        >
          {/* STALE PRICE WARNING BANNER */}
          {hasStalePrice ? (
            <View style={styles.staleBanner}>
              <GoogleIcon name="schedule" size={18} color={colors.brand.amber} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.staleTitle}>Stale Price Alert</Text>
                <Text style={styles.staleSubtitle}>
                  Some store listings are older than 24h. Tap refresh to fetch the latest prices.
                </Text>
              </View>
              <TouchableOpacity onPress={() => fetchComparisonData(true)} style={styles.staleRefreshBtn}>
                <GoogleIcon name="refresh" size={16} color={colors.brand.amber} />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* PRODUCT HERO CARD */}
          <Card variant="glass" style={styles.productHeroCard}>
            <View style={styles.productHeroHeader}>
              <View style={styles.productThumbnailBox}>
                <Image
                  source={{
                    uri:
                      comparisonData.product.image ||
                      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
                  }}
                  style={styles.productThumbnail}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.productHeaderDetails}>
                <View style={styles.categoryRow}>
                  <Text style={styles.brandBadge}>
                    {comparisonData.product.brand?.toUpperCase() || 'BRAND'}
                  </Text>
                  {comparisonData.product.model ? (
                    <Text style={styles.modelBadge}>{comparisonData.product.model}</Text>
                  ) : null}
                </View>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {comparisonData.product.canonicalProductName || comparisonData.product.title}
                </Text>
                <Text style={styles.categoryText}>
                  Category: {comparisonData.product.category || 'Electronics'}
                </Text>
              </View>
            </View>

            {/* BEST VALUE CALLOUT */}
            {comparisonData.lowest ? (
              <View style={styles.bestOfferCallout}>
                <View style={styles.bestOfferRow}>
                  <View>
                    <View style={styles.bestBadgeRow}>
                      <GoogleIcon name="verified" size={15} color={colors.status.success} style={{ marginRight: 4 }} />
                      <Text style={styles.bestLabel}>Lowest Verified Price</Text>
                    </View>
                    <Text style={styles.bestPrice}>
                      {formatPrice(comparisonData.lowest.effectivePrice, comparisonData.lowest.currency)}
                    </Text>
                    <Text style={styles.bestStoreText}>
                      Available at <Text style={styles.boldWhite}>{comparisonData.lowest.retailer}</Text>
                    </Text>
                  </View>

                  {comparisonData.savings > 0 ? (
                    <View style={styles.savingsBox}>
                      <Text style={styles.savingsLabel}>You Save</Text>
                      <Text style={styles.savingsAmount}>
                        {formatPrice(comparisonData.savings, comparisonData.lowest.currency)}
                      </Text>
                      <Text style={styles.savingsPercent}>({comparisonData.savingsPercentage}% OFF)</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}
          </Card>

          {/* MARKET STATS OVERVIEW BAR */}
          <View style={styles.marketStatsRow}>
            <View style={styles.marketStatBox}>
              <Text style={styles.marketStatLabel}>Lowest Price</Text>
              <Text style={[styles.marketStatValue, { color: colors.status.success }]}>
                {comparisonData.lowest
                  ? formatPrice(comparisonData.lowest.effectivePrice, comparisonData.lowest.currency)
                  : 'N/A'}
              </Text>
            </View>
            <View style={styles.marketStatBox}>
              <Text style={styles.marketStatLabel}>Average Price</Text>
              <Text style={styles.marketStatValue}>
                {formatPrice(comparisonData.averagePrice, comparisonData.lowest?.currency || 'INR')}
              </Text>
            </View>
            <View style={styles.marketStatBox}>
              <Text style={styles.marketStatLabel}>Highest Price</Text>
              <Text style={[styles.marketStatValue, { color: colors.text.muted }]}>
                {comparisonData.highest
                  ? formatPrice(comparisonData.highest.effectivePrice, comparisonData.highest.currency)
                  : 'N/A'}
              </Text>
            </View>
          </View>

          {/* SECTION TITLE */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Authorized Store Offers</Text>
            <Text style={styles.offersCount}>
              {comparisonData.availableRetailers.length} of {comparisonData.offers.length} In Stock
            </Text>
          </View>

          {/* STORE OFFER CARDS */}
          {comparisonData.offers.map((offer, idx) => {
            const isLowest = comparisonData.lowest?.retailer === offer.retailer && offer.availability;

            return (
              <Card
                key={idx}
                variant={isLowest ? 'highlight' : 'default'}
                style={[styles.offerCard, !offer.availability ? styles.offerCardOOS : undefined]}
              >
                {/* Store Header Row */}
                <View style={styles.storeTopRow}>
                  <View style={styles.storeNameBadgeRow}>
                    <GoogleIcon name="storefront" size={18} color={colors.brand.primaryGlow} style={{ marginRight: 6 }} />
                    <Text style={styles.storeName}>{offer.retailer}</Text>
                    {isLowest ? (
                      <View style={styles.bestDealTag}>
                        <Text style={styles.bestDealTagText}>LOWEST PRICE</Text>
                      </View>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.stockStatusBadge,
                      offer.availability ? styles.stockIn : styles.stockOut,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockStatusText,
                        { color: offer.availability ? colors.status.success : colors.status.error },
                      ]}
                    >
                      {offer.availability ? '● Available' : '○ Out of Stock'}
                    </Text>
                  </View>
                </View>

                {/* Pricing & Savings Breakdown */}
                <View style={styles.pricingRow}>
                  <View style={styles.pricingLeft}>
                    <Text
                      style={[
                        styles.offerEffectivePrice,
                        isLowest && { color: colors.status.success },
                        !offer.availability && { color: colors.text.muted, textDecorationLine: 'line-through' },
                      ]}
                    >
                      {formatPrice(offer.effectivePrice, offer.currency)}
                    </Text>

                    {offer.mrp && offer.mrp > offer.price ? (
                      <View style={styles.mrpRow}>
                        <Text style={styles.mrpText}>
                          MRP: {formatPrice(offer.mrp, offer.currency)}
                        </Text>
                        <Text style={styles.discountText}>
                          ({Math.round(((offer.mrp - offer.price) / offer.mrp) * 100)}% off)
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.metaRow}>
                      <GoogleIcon name="local-shipping" size={13} color={colors.text.muted} style={{ marginRight: 4 }} />
                      <Text style={styles.metaText}>
                        {offer.deliveryFee === 0 ? 'FREE Delivery' : `+${formatPrice(offer.deliveryFee || 0, offer.currency)} Delivery`}
                      </Text>
                    </View>

                    <View style={styles.metaRow}>
                      <GoogleIcon name="schedule" size={13} color={colors.text.muted} style={{ marginRight: 4 }} />
                      <Text style={styles.metaText}>{formatTimeAgo(offer.lastChecked)}</Text>
                    </View>
                  </View>

                  {/* BUY NOW BUTTON */}
                  <View style={styles.pricingRight}>
                    <Button
                      title={offer.availability ? `Buy on ${offer.retailer}` : 'Out of Stock'}
                      icon="open-in-new"
                      variant={isLowest ? 'primary' : 'secondary'}
                      disabled={!offer.availability}
                      onPress={() => handleBuyNow(offer.destinationUrl || offer.url, offer.retailer)}
                      style={styles.buyNowBtn}
                    />
                  </View>
                </View>

                {/* Card Sub-Footer: Price History & Details */}
                <View style={styles.offerFooter}>
                  <Text style={styles.sellerText}>
                    Sold by: <Text style={{ color: colors.text.secondary }}>{offer.seller?.name || offer.retailer}</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.historyLink}
                    onPress={() =>
                      navigation.navigate('PriceHistory', {
                        productId: `${offer.retailerSlug || 'prod'}-p1`,
                        title: comparisonData.product.canonicalProductName || comparisonData.product.title,
                        currentPrice: offer.price,
                      })
                    }
                  >
                    <GoogleIcon name="show-chart" size={14} color={colors.brand.primaryGlow} style={{ marginRight: 4 }} />
                    <Text style={styles.historyLinkText}>Price History</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}

          {/* SET ALERT SHORTCUT CARD */}
          <Card variant="elevated" style={styles.alertCard}>
            <View style={styles.alertHeaderRow}>
              <GoogleIcon name="notifications-active" size={20} color={colors.brand.amber} style={{ marginRight: 8 }} />
              <Text style={styles.alertCardTitle}>Price Drop Alerts</Text>
            </View>
            <Text style={styles.alertCardSubtitle}>
              Get notified immediately when Amazon, Flipkart, or Croma drops below your target price.
            </Text>
            <Button
              title="Set Instant Price Alert"
              icon="add-alert"
              variant="primary"
              onPress={() => navigation.navigate('Main', { screen: 'Alerts' })}
              style={styles.alertBtn}
            />
          </Card>
        </ScrollView>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  stateCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingTitle: {
    fontSize: typography.fontSizes.md + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  loadingSubtitle: {
    fontSize: typography.fontSizes.xs + 1,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorCard: {
    width: '100%',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorCardTitle: {
    fontSize: typography.fontSizes.md + 2,
    fontWeight: typography.fontWeights.bold,
    color: colors.status.error,
    marginBottom: spacing.xs,
  },
  errorCardMessage: {
    fontSize: typography.fontSizes.xs + 1,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  emptyCard: {
    width: '100%',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.md + 2,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.xs + 1,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  retryBtn: {
    width: '100%',
  },
  staleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  staleTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.amber,
  },
  staleSubtitle: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.secondary,
    marginTop: 2,
    lineHeight: 16,
  },
  staleRefreshBtn: {
    padding: spacing.xs,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: radii.full,
  },
  productHeroCard: {
    marginBottom: spacing.md,
  },
  productHeroHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  productThumbnailBox: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
    marginRight: spacing.md,
    borderColor: colors.border.subtle,
    borderWidth: 1,
  },
  productThumbnail: {
    width: '100%',
    height: '100%',
  },
  productHeaderDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  brandBadge: {
    fontSize: typography.fontSizes.xs - 2,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.brand.cyan,
    letterSpacing: 1.1,
  },
  modelBadge: {
    fontSize: typography.fontSizes.xs - 2,
    color: colors.text.muted,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.xs,
  },
  productTitle: {
    fontSize: typography.fontSizes.sm + 2,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: 2,
  },
  categoryText: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.muted,
  },
  bestOfferCallout: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: colors.border.success,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm + 2,
  },
  bestOfferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bestBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  bestLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.status.success,
    fontWeight: typography.fontWeights.bold,
  },
  bestPrice: {
    fontSize: typography.fontSizes.lg + 2,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.text.primary,
  },
  bestStoreText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  boldWhite: {
    color: colors.text.primary,
    fontWeight: typography.fontWeights.bold,
  },
  savingsBox: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderColor: colors.border.success,
    borderWidth: 1,
  },
  savingsLabel: {
    fontSize: typography.fontSizes.xs - 2,
    color: colors.status.success,
    fontWeight: typography.fontWeights.bold,
    textTransform: 'uppercase',
  },
  savingsAmount: {
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.status.success,
  },
  savingsPercent: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.status.success,
    fontWeight: typography.fontWeights.semibold,
  },
  marketStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  marketStatBox: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderColor: colors.border.subtle,
    borderWidth: 1,
  },
  marketStatLabel: {
    fontSize: typography.fontSizes.xs - 2,
    color: colors.text.muted,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  marketStatValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  offersCount: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.brand.cyan,
    fontWeight: typography.fontWeights.semibold,
  },
  offerCard: {
    marginBottom: spacing.md,
  },
  offerCardOOS: {
    opacity: 0.65,
  },
  storeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  storeNameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeName: {
    fontSize: typography.fontSizes.sm + 2,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
  bestDealTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: colors.border.success,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.xs,
  },
  bestDealTagText: {
    color: colors.status.success,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  stockStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  stockIn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  stockOut: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  stockStatusText: {
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.bold,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  pricingLeft: {
    flex: 1,
  },
  offerEffectivePrice: {
    fontSize: typography.fontSizes.xl + 2,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.text.primary,
  },
  mrpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  mrpText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
    textDecorationLine: 'line-through',
  },
  discountText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.primaryGlow,
    fontWeight: typography.fontWeights.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  metaText: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.muted,
  },
  pricingRight: {
    marginLeft: spacing.md,
    minWidth: 110,
  },
  buyNowBtn: {
    minHeight: 40,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  sellerText: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.muted,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyLinkText: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.brand.primaryGlow,
    fontWeight: typography.fontWeights.semibold,
  },
  alertCard: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertCardTitle: {
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  alertCardSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  alertBtn: {
    width: '100%',
  },
});
