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

  const initialProduct = {
    title: route.params?.title || 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    brand: 'Sony',
    model: 'WH-1000XM5',
    canonicalProductName: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    category: route.params?.category || 'Headphones & Audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
  };

  const initialOffers: RetailerOffer[] = [
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
      status: 'VERIFIED',
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
      status: 'VERIFIED',
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
      url: 'https://www.croma.com/sony-wh-1000xm5/p/260000',
      availability: true,
      status: 'VERIFIED',
      seller: { name: 'Croma Official Electronics', isAuthorized: true },
      lastChecked: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ];

  const fetchComparison = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    const defaultAvailable = initialOffers.map(o => ({
      retailer: o.retailer,
      effectivePrice: o.effectivePrice,
      currency: o.currency,
      status: o.status,
      url: o.url || '',
    }));

    try {
      if (route.params?.initialData) {
        const d = route.params.initialData;
        const lowestOffer = d.offers.reduce(
          (min: RetailerOffer, curr: RetailerOffer) => (curr.effectivePrice < min.effectivePrice ? curr : min),
          d.offers[0]
        );
        const highestOffer = d.offers.reduce(
          (max: RetailerOffer, curr: RetailerOffer) => (curr.effectivePrice > max.effectivePrice ? curr : max),
          d.offers[0]
        );
        const avg = Math.round(
          d.offers.reduce((sum: number, o: RetailerOffer) => sum + o.effectivePrice, 0) / (d.offers.length || 1)
        );

        setComparisonData({
          product: d.product,
          offers: d.offers,
          lowest: lowestOffer,
          highest: highestOffer,
          averagePrice: avg,
          savings: highestOffer.effectivePrice - lowestOffer.effectivePrice,
          savingsPercentage: Math.round(
            ((highestOffer.effectivePrice - lowestOffer.effectivePrice) / (highestOffer.effectivePrice || 1)) * 100
          ),
          availableRetailers: d.offers.filter((o: RetailerOffer) => o.availability).map((o: RetailerOffer) => ({
            retailer: o.retailer,
            effectivePrice: o.effectivePrice,
            currency: o.currency,
            status: o.status,
            url: o.url || '',
          })),
          unavailableRetailers: d.offers.filter((o: RetailerOffer) => !o.availability).map((o: RetailerOffer) => ({
            retailer: o.retailer,
            status: 'UNAVAILABLE',
            url: o.url || '',
          })),
          comparisonTimestamp: new Date().toISOString(),
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await productApi.compareOffers(initialProduct, initialOffers);

      if (res.success && res.data) {
        setComparisonData(res.data);
      } else {
        setComparisonData({
          product: initialProduct,
          offers: initialOffers,
          lowest: initialOffers[0],
          highest: initialOffers[2],
          averagePrice: 25832,
          savings: 2000,
          savingsPercentage: 7,
          availableRetailers: defaultAvailable,
          unavailableRetailers: [],
          comparisonTimestamp: new Date().toISOString(),
        });
      }
    } catch {
      setComparisonData({
        product: initialProduct,
        offers: initialOffers,
        lowest: initialOffers[0],
        highest: initialOffers[2],
        averagePrice: 25832,
        savings: 2000,
        savingsPercentage: 7,
        availableRetailers: defaultAvailable,
        unavailableRetailers: [],
        comparisonTimestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [route.params]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  const handleBuyNow = async (url: string, retailer: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Store Link', `Opening ${retailer} checkout in browser...`);
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert('Unable to open link', `Could not open ${retailer} link.`);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderBar
        title="Store Price Comparison"
        subtitle="Multi-Store Live Pricing & Availability"
        showBack={true}
      />

      {loading && !refreshing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Auditing live store offers...</Text>
        </View>
      ) : null}

      {!loading && comparisonData ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchComparison(true)}
              tintColor="#2563EB"
              colors={['#0F172A', '#2563EB']}
            />
          }
        >
          {/* PRODUCT HERO CARD */}
          <View style={styles.productCard}>
            <View style={styles.productTopRow}>
              {comparisonData.product.image ? (
                <View style={styles.productImageBox}>
                  <Image
                    source={{ uri: comparisonData.product.image }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                </View>
              ) : null}

              <View style={styles.productInfo}>
                <View style={styles.brandTag}>
                  <Text style={styles.brandText}>
                    {comparisonData.product.brand?.toUpperCase() || 'VERIFIED'}
                  </Text>
                </View>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {comparisonData.product.title}
                </Text>
                <Text style={styles.categoryText}>
                  {comparisonData.product.category || 'Electronics'}
                </Text>
              </View>
            </View>

            {/* BEST VALUE CALLOUT */}
            {comparisonData.lowest ? (
              <View style={styles.bestOfferCallout}>
                <View style={styles.bestOfferRow}>
                  <View>
                    <View style={styles.bestBadgeRow}>
                      <GoogleIcon name="verified" size={14} color="#2563EB" style={{ marginRight: 4 }} />
                      <Text style={styles.bestLabel}>Lowest Verified Price</Text>
                    </View>
                    <Text style={styles.bestPrice}>
                      {formatPrice(comparisonData.lowest.effectivePrice, comparisonData.lowest.currency)}
                    </Text>
                    <Text style={styles.bestStoreText}>
                      Available at <Text style={styles.boldForest}>{comparisonData.lowest.retailer}</Text>
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
          </View>

          {/* MARKET STATS OVERVIEW BAR */}
          <View style={styles.marketStatsRow}>
            <View style={styles.marketStatBox}>
              <Text style={styles.marketStatLabel}>Lowest Price</Text>
              <Text style={[styles.marketStatValue, { color: '#2563EB' }]}>
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
              <Text style={[styles.marketStatValue, { color: '#9CA3AF' }]}>
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
              <View
                key={idx}
                style={[
                  styles.offerCard,
                  isLowest && styles.offerCardLowest,
                  !offer.availability && styles.offerCardOOS,
                ]}
              >
                {/* Store Header Row */}
                <View style={styles.storeTopRow}>
                  <View style={styles.storeNameBadgeRow}>
                    <GoogleIcon name="storefront" size={18} color="#0F172A" style={{ marginRight: 6 }} />
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
                        { color: offer.availability ? '#1D4ED8' : '#DC2626' },
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
                        isLowest && { color: '#2563EB' },
                        !offer.availability && { color: '#9CA3AF', textDecorationLine: 'line-through' },
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
                      <GoogleIcon name="local-shipping" size={13} color="#6B7280" style={{ marginRight: 4 }} />
                      <Text style={styles.metaText}>
                        {offer.deliveryFee === 0 ? 'FREE Delivery' : `+${formatPrice(offer.deliveryFee || 0, offer.currency)} Delivery`}
                      </Text>
                    </View>

                    <View style={styles.metaRow}>
                      <GoogleIcon name="schedule" size={13} color="#6B7280" style={{ marginRight: 4 }} />
                      <Text style={styles.metaText}>{formatTimeAgo(offer.lastChecked)}</Text>
                    </View>
                  </View>

                  {/* BUY NOW BUTTON */}
                  <View style={styles.pricingRight}>
                    <TouchableOpacity
                      style={[
                        styles.buyNowBtn,
                        isLowest ? styles.buyNowBtnPrimary : styles.buyNowBtnSecondary,
                        !offer.availability && styles.buyNowBtnDisabled,
                      ]}
                      disabled={!offer.availability}
                      onPress={() => handleBuyNow(offer.destinationUrl || offer.url || '', offer.retailer)}
                      activeOpacity={0.88}
                    >
                      <GoogleIcon
                        name="open-in-new"
                        size={15}
                        color={isLowest ? '#FFFFFF' : '#0F172A'}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.buyNowBtnText,
                          isLowest ? styles.buyNowTextPrimary : styles.buyNowTextSecondary,
                        ]}
                      >
                        {offer.availability ? `Buy on ${offer.retailer}` : 'Out of Stock'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Card Sub-Footer: Price History & Details */}
                <View style={styles.offerFooter}>
                  <Text style={styles.sellerText}>
                    Sold by: <Text style={{ color: '#0F172A', fontWeight: '600' }}>{offer.seller?.name || offer.retailer}</Text>
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
                    <GoogleIcon name="show-chart" size={14} color="#2563EB" style={{ marginRight: 4 }} />
                    <Text style={styles.historyLinkText}>Price History</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* SET ALERT SHORTCUT CARD */}
          <View style={styles.alertCard}>
            <View style={styles.alertHeaderRow}>
              <GoogleIcon name="notifications-active" size={20} color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.alertCardTitle}>Track Price Drops</Text>
            </View>
            <Text style={styles.alertCardSubtitle}>
              Get notified immediately when Amazon, Flipkart, or Croma drops below your budget.
            </Text>
            <TouchableOpacity
              style={styles.alertBtn}
              onPress={() => navigation.navigate('Main', { screen: 'Alerts' })}
              activeOpacity={0.88}
            >
              <GoogleIcon name="add-alert" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.alertBtnText}>Set Instant Price Alert</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  productTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  productImageBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 14,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    flex: 1,
  },
  brandTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  brandText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  bestOfferCallout: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1.2,
    borderRadius: 16,
    padding: 14,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  bestPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 2,
  },
  bestStoreText: {
    fontSize: 12,
    color: '#6B7280',
  },
  boldForest: {
    fontWeight: '800',
    color: '#0F172A',
  },
  savingsBox: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  savingsLabel: {
    fontSize: 9,
    color: '#2563EB',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  savingsAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  savingsPercent: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '700',
  },
  marketStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 18,
  },
  marketStatBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  marketStatLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  marketStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  offersCount: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  offerCardLowest: {
    borderColor: '#93C5FD',
    backgroundColor: '#FFFFFF',
  },
  offerCardOOS: {
    opacity: 0.6,
  },
  storeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  storeNameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 6,
  },
  bestDealTag: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bestDealTagText: {
    color: '#1D4ED8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stockStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stockIn: {
    backgroundColor: '#EFF6FF',
  },
  stockOut: {
    backgroundColor: '#FEF2F2',
  },
  stockStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  pricingLeft: {
    flex: 1,
  },
  offerEffectivePrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  mrpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  mrpText: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  discountText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  metaText: {
    fontSize: 11,
    color: '#6B7280',
  },
  pricingRight: {
    marginLeft: 12,
    minWidth: 120,
  },
  buyNowBtn: {
    height: 42,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  buyNowBtnPrimary: {
    backgroundColor: '#0F172A',
  },
  buyNowBtnSecondary: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
  },
  buyNowBtnDisabled: {
    backgroundColor: '#F1F5F9',
  },
  buyNowBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  buyNowTextPrimary: {
    color: '#FFFFFF',
  },
  buyNowTextSecondary: {
    color: '#0F172A',
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sellerText: {
    fontSize: 11,
    color: '#6B7280',
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyLinkText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
  },
  alertCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
    marginBottom: 20,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  alertCardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 18,
  },
  alertBtn: {
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
