import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../theme';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { watchlistApi, WatchlistItem } from '../services/productApi';
import { useAuth } from '../context/AuthContext';
import { MainTabScreenProps } from '../navigation/types';

// Helper for formatting price
const formatPrice = (price?: number | null) => {
  if (price === undefined || price === null) return 'N/A';
  return `₹${price.toLocaleString('en-IN')}`;
};

export const WatchlistScreen: React.FC<MainTabScreenProps<'Watchlist'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { token, isAuthenticated } = useAuth();

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'TARGET_REACHED' | 'PRICE_DROPS'>('ALL');

  // Initial seed data for non-authenticated or empty initial demo state
  const mockWatchlist: WatchlistItem[] = [
    {
      id: 'mock-1',
      productId: 'p1',
      title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
      brand: 'Sony',
      model: 'WH-1000XM5',
      category: 'Headphones & Audio',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
      currentPrice: 24999,
      lowestRecordedPrice: 23999,
      highestRecordedPrice: 29990,
      initialPrice: 26999,
      targetPrice: 25000,
      isTargetReached: true, // 24999 <= 25000
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-2',
      productId: 'p2',
      title: 'Apple MacBook Air 13-inch M3 (16GB RAM, 512GB SSD Storage)',
      brand: 'Apple',
      model: 'MacBook Air M3',
      category: 'Computers & Laptops',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
      currentPrice: 114900,
      lowestRecordedPrice: 109900,
      highestRecordedPrice: 124900,
      initialPrice: 119900,
      targetPrice: 110000,
      isTargetReached: false,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const fetchWatchlist = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      if (isAuthenticated && token) {
        const res = await watchlistApi.getWatchlist(token);
        if (res.success && Array.isArray(res.data)) {
          setWatchlist(res.data);
        } else {
          setWatchlist(mockWatchlist);
        }
      } else {
        setWatchlist(mockWatchlist);
      }
    } catch {
      setWatchlist(mockWatchlist);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const handleRemove = async (item: WatchlistItem) => {
    Alert.alert(
      'Remove from Watchlist',
      `Stop tracking price drops for "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // Optimistic update
            setWatchlist((prev) => prev.filter((i) => i.id !== item.id));

            if (isAuthenticated && token) {
              await watchlistApi.removeFromWatchlist(item.id, token);
            }
          },
        },
      ]
    );
  };

  // Filtered list
  const filteredItems = watchlist.filter((item) => {
    if (filter === 'TARGET_REACHED') return item.isTargetReached;
    if (filter === 'PRICE_DROPS') return item.currentPrice < item.initialPrice;
    return true;
  });

  const totalSavedEstimate = watchlist.reduce((acc, curr) => {
    if (curr.initialPrice && curr.currentPrice < curr.initialPrice) {
      return acc + (curr.initialPrice - curr.currentPrice);
    }
    return acc;
  }, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Screen Title Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Watchlist</Text>
          <Text style={styles.headerSubtitle}>
            Real-time price tracking & target threshold alerts
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => fetchWatchlist(true)}
          style={styles.refreshBtn}
        >
          <GoogleIcon name="sync" size={20} color={colors.brand.primaryGlow} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchWatchlist(true)}
            tintColor={colors.brand.primaryGlow}
            colors={[colors.brand.primary]}
          />
        }
      >
        {/* Watchlist Metrics Overview Banner */}
        <Card variant="glass" style={styles.metricsCard}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Tracked Items</Text>
            <Text style={styles.metricValue}>{watchlist.length}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Target Reached</Text>
            <Text style={[styles.metricValue, { color: colors.status.success }]}>
              {watchlist.filter((i) => i.isTargetReached).length}
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Estimated Savings</Text>
            <Text style={[styles.metricValue, { color: colors.brand.primaryGlow }]}>
              {formatPrice(totalSavedEstimate)}
            </Text>
          </View>
        </Card>

        {/* Filter Chips Bar */}
        <View style={styles.filterRow}>
          {(
            [
              { key: 'ALL', label: 'All Items' },
              { key: 'TARGET_REACHED', label: '🎯 Target Reached' },
              { key: 'PRICE_DROPS', label: '🔥 Price Drops' },
            ] as const
          ).map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.activeFilterChip]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f.key && styles.activeFilterText,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading Indicator */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.brand.primaryGlow} />
            <Text style={styles.loadingText}>Syncing Watched Products...</Text>
          </View>
        ) : null}

        {/* Empty Watchlist State */}
        {!loading && filteredItems.length === 0 ? (
          <Card variant="default" style={styles.emptyCard}>
            <GoogleIcon
              name="inventory-2"
              size={48}
              color={colors.text.muted}
              style={{ marginBottom: spacing.sm }}
            />
            <Text style={styles.emptyTitle}>No Tracked Items Found</Text>
            <Text style={styles.emptyDesc}>
              Paste any e-commerce product link or explore deals on the Home screen to track live prices.
            </Text>
            <Button
              title="Audit a Product Link"
              icon="link"
              variant="primary"
              onPress={() => navigation.navigate('AnalyzeProduct')}
              style={styles.emptyBtn}
            />
          </Card>
        ) : null}

        {/* Watched Products List */}
        {!loading &&
          filteredItems.map((item) => {
            const hasDropped = item.initialPrice && item.currentPrice < item.initialPrice;
            const dropAmount = hasDropped ? item.initialPrice - item.currentPrice : 0;

            return (
              <Card key={item.id} variant="default" style={styles.itemCard}>
                {/* Target Price Reached Banner */}
                {item.isTargetReached ? (
                  <View style={styles.targetReachedBanner}>
                    <GoogleIcon name="celebration" size={16} color={colors.status.success} style={{ marginRight: 6 }} />
                    <Text style={styles.targetReachedText}>
                      Target Price Reached! Current price ({formatPrice(item.currentPrice)}) is at or below target ({formatPrice(item.targetPrice)}).
                    </Text>
                  </View>
                ) : null}

                {/* Product Header Row */}
                <View style={styles.itemHeader}>
                  <View style={styles.brandRow}>
                    <Text style={styles.brandText}>{item.brand?.toUpperCase()}</Text>
                    {item.model ? (
                      <View style={styles.modelTag}>
                        <Text style={styles.modelTagText}>{item.model}</Text>
                      </View>
                    ) : null}
                  </View>

                  {hasDropped ? (
                    <View style={styles.dropBadge}>
                      <GoogleIcon name="trending-down" size={13} color={colors.status.success} style={{ marginRight: 2 }} />
                      <Text style={styles.dropBadgeText}>-{formatPrice(dropAmount)} Drop</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    onPress={() => handleRemove(item)}
                    style={styles.removeBtn}
                  >
                    <GoogleIcon name="delete-outline" size={18} color={colors.text.muted} />
                  </TouchableOpacity>
                </View>

                {/* Product Title & Thumbnail */}
                <View style={styles.productRow}>
                  <View style={styles.thumbnailBox}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.titleBox}>
                    <Text style={styles.itemTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.categoryText}>
                      {item.category}
                    </Text>
                  </View>
                </View>

                {/* Price Metrics Triple Column (Current, All-Time Low, Target Price) */}
                <View style={styles.pricesTripleRow}>
                  <View style={styles.priceCol}>
                    <Text style={styles.priceColLabel}>Current Price</Text>
                    <Text style={[styles.priceColValue, { color: colors.text.primary }]}>
                      {formatPrice(item.currentPrice)}
                    </Text>
                  </View>

                  <View style={styles.priceCol}>
                    <Text style={styles.priceColLabel}>All-Time Low</Text>
                    <Text style={[styles.priceColValue, { color: colors.status.success }]}>
                      {formatPrice(item.lowestRecordedPrice)}
                    </Text>
                  </View>

                  <View style={styles.priceCol}>
                    <Text style={styles.priceColLabel}>Target Price</Text>
                    <Text
                      style={[
                        styles.priceColValue,
                        item.targetPrice ? { color: colors.brand.amber } : { color: colors.text.muted },
                      ]}
                    >
                      {item.targetPrice ? formatPrice(item.targetPrice) : 'Not Set'}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons: Compare Stores & Price History */}
                <View style={styles.cardActionsRow}>
                  <Button
                    title="Compare Stores"
                    icon="compare-arrows"
                    variant="primary"
                    size="sm"
                    onPress={() =>
                      navigation.navigate('ProductComparison', {
                        title: item.title,
                        category: item.category,
                      })
                    }
                    style={styles.actionBtn}
                  />
                  <Button
                    title="Price History"
                    icon="show-chart"
                    variant="secondary"
                    size="sm"
                    onPress={() =>
                      navigation.navigate('PriceHistory', {
                        productId: item.productId || item.id,
                        title: item.title,
                        currentPrice: item.currentPrice,
                      })
                    }
                    style={styles.actionBtn}
                  />
                </View>
              </Card>
            );
          })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  refreshBtn: {
    padding: spacing.xs,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderRadius: radii.full,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  metricsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
  },
  metricCol: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.muted,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border.default,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    backgroundColor: colors.background.card,
    borderColor: colors.border.subtle,
    borderWidth: 1,
  },
  activeFilterChip: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  filterText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeights.medium,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: typography.fontSizes.xs + 1,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  emptyBtn: {
    width: '80%',
  },
  itemCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  targetReachedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.border.success,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  targetReachedText: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: colors.status.success,
    fontWeight: typography.fontWeights.bold,
    lineHeight: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.cyan,
    letterSpacing: 1.1,
  },
  modelTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.xs,
  },
  modelTagText: {
    fontSize: 8,
    color: colors.text.muted,
  },
  dropBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginLeft: spacing.sm,
  },
  dropBadgeText: {
    color: colors.status.success,
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.bold,
  },
  removeBtn: {
    marginLeft: 'auto',
    padding: spacing.xs,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  thumbnailBox: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
    marginRight: spacing.sm,
    borderColor: colors.border.subtle,
    borderWidth: 1,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  titleBox: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
    lineHeight: 18,
  },
  categoryText: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  pricesTripleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginVertical: spacing.sm,
  },
  priceCol: {
    flex: 1,
    alignItems: 'center',
  },
  priceColLabel: {
    fontSize: 9,
    color: colors.text.muted,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  priceColValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  actionBtn: {
    flex: 1,
  },
});
