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
      isTargetReached: true,
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
            setWatchlist((prev) => prev.filter((i) => i.id !== item.id));
            if (isAuthenticated && token) {
              await watchlistApi.removeFromWatchlist(item.id, token);
            }
          },
        },
      ]
    );
  };

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
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      {/* Screen Title Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Price Watchlist</Text>
          <Text style={styles.headerSubtitle}>
            Real-time price drop tracking & target threshold alerts
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => fetchWatchlist(true)}
          style={styles.refreshBtn}
          activeOpacity={0.75}
        >
          <GoogleIcon name="sync" size={18} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 95 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchWatchlist(true)}
            tintColor="#2563EB"
            colors={['#0F172A', '#2563EB']}
          />
        }
      >
        {/* Watchlist Metrics Overview Banner */}
        <View style={styles.metricsCard}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Tracked Items</Text>
            <Text style={styles.metricValue}>{watchlist.length}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Target Reached</Text>
            <Text style={[styles.metricValue, { color: '#2563EB' }]}>
              {watchlist.filter((i) => i.isTargetReached).length}
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Total Savings</Text>
            <Text style={[styles.metricValue, { color: '#0F172A' }]}>
              {formatPrice(totalSavedEstimate)}
            </Text>
          </View>
        </View>

        {/* Filter Chips Bar */}
        <View style={styles.filterRow}>
          {(
            [
              { key: 'ALL', label: 'All Items' },
              { key: 'TARGET_REACHED', label: '🎯 Target Met' },
              { key: 'PRICE_DROPS', label: '🔥 Price Drops' },
            ] as const
          ).map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.activeFilterChip]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
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

        {/* Loading State */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Fetching tracked products & live prices...</Text>
          </View>
        ) : null}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <GoogleIcon name="bookmark-border" size={32} color="#2563EB" />
            </View>
            <Text style={styles.emptyTitle}>Your Watchlist is Empty</Text>
            <Text style={styles.emptyDesc}>
              Track products from Amazon, Flipkart, and Croma. Receive instant alerts when prices drop below your target price.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('AnalyzeProduct')}
              activeOpacity={0.85}
            >
              <View style={styles.emptyBtnInner}>
                <GoogleIcon name="search" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyBtnText}>Explore & Audit Deals</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Watchlist Product Cards */}
        {!loading &&
          filteredItems.map((item) => {
            const hasDropped = item.currentPrice < item.initialPrice;
            const dropAmount = item.initialPrice - item.currentPrice;

            return (
              <View key={item.id} style={styles.itemCard}>
                {/* Target Reached Badge */}
                {item.isTargetReached ? (
                  <View style={styles.targetReachedBanner}>
                    <GoogleIcon name="verified" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                    <Text style={styles.targetReachedText}>
                      Target price of {formatPrice(item.targetPrice || 0)} reached!
                    </Text>
                  </View>
                ) : null}

                {/* Header with Brand & Actions */}
                <View style={styles.itemHeader}>
                  <View style={styles.brandRow}>
                    <View style={styles.brandTag}>
                      <Text style={styles.brandText}>{item.brand?.toUpperCase() || 'PRODUCT'}</Text>
                    </View>
                    {item.model ? (
                      <View style={styles.modelTag}>
                        <Text style={styles.modelTagText}>{item.model}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.headerRightActions}>
                    {hasDropped ? (
                      <View style={styles.dropBadge}>
                        <GoogleIcon name="trending-down" size={13} color="#2563EB" style={{ marginRight: 3 }} />
                        <Text style={styles.dropBadgeText}>-{formatPrice(dropAmount)}</Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      onPress={() => handleRemove(item)}
                      style={styles.removeBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <GoogleIcon name="delete-outline" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
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
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                </View>

                {/* Price Breakdown Triple Matrix */}
                <View style={styles.pricesTripleRow}>
                  <View style={styles.priceCol}>
                    <Text style={styles.priceColLabel}>Current Price</Text>
                    <Text style={styles.priceColCurrent}>{formatPrice(item.currentPrice)}</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.priceCol}>
                    <Text style={styles.priceColLabel}>All-Time Low</Text>
                    <Text style={styles.priceColLowest}>{formatPrice(item.lowestRecordedPrice)}</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.priceCol}>
                    <Text style={styles.priceColLabel}>Target Price</Text>
                    <Text
                      style={[
                        styles.priceColTarget,
                        { color: item.isTargetReached ? '#2563EB' : '#64748B' },
                      ]}
                    >
                      {item.targetPrice ? formatPrice(item.targetPrice) : 'Not Set'}
                    </Text>
                  </View>
                </View>

                {/* Bottom Action Buttons */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={() =>
                      navigation.navigate('ProductComparison', {
                        title: item.title,
                        category: item.category,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <GoogleIcon name="compare-arrows" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryActionBtnText}>Compare Stores</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryActionBtn}
                    onPress={() =>
                      navigation.navigate('PriceHistory', {
                        productId: item.productId || item.id,
                        title: item.title,
                        currentPrice: item.currentPrice,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <GoogleIcon name="show-chart" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                    <Text style={styles.secondaryActionBtnText}>Price History</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flex: 1,
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
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  metricsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 20,
    paddingVertical: 14,
    marginBottom: 16,
  },
  metricCol: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 3,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
  },
  activeFilterChip: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  targetReachedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 12,
  },
  targetReachedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  brandText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  modelTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modelTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dropBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  removeBtn: {
    padding: 2,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  thumbnailBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  titleBox: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 19,
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  pricesTripleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  priceCol: {
    alignItems: 'center',
  },
  priceColLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  priceColCurrent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  priceColLowest: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  priceColTarget: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
});
