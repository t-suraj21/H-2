import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../theme';
import { HeaderBar } from '../components/common/HeaderBar';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { productApi, PriceHistoryData, PriceTimelinePoint } from '../services/productApi';
import { RootStackScreenProps } from '../navigation/types';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Helper to format currency
const formatCurrency = (amount: number, currency: string = 'INR') => {
  const symbol = currency === 'USD' || currency === '$' ? '$' : '₹';
  return `${symbol}${amount.toLocaleString('en-IN')}`;
};

// Helper to format short date (e.g. 'Aug 24')
const formatShortDate = (isoString: string) => {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const PriceHistoryScreen: React.FC<RootStackScreenProps<'PriceHistory'>> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { productId = 'prod-sony-xm5', title = 'Sony WH-1000XM5' } = route.params || {};

  const [period, setPeriod] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<PriceHistoryData | null>(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  const fetchHistory = useCallback(
    async (selectedPeriod: string = period, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage(null);

      try {
        const response = await productApi.getPriceHistory(productId, selectedPeriod);
        if (response.success && response.data) {
          setHistoryData(response.data);
          if (response.data.timeline.length > 0) {
            setSelectedPointIndex(response.data.timeline.length - 1);
          }
        } else {
          setErrorMessage(response.message || 'Failed to load historical price data.');
        }
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Network error loading price history.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [productId, period]
  );

  useEffect(() => {
    fetchHistory(period);
  }, [fetchHistory, period]);

  const handlePeriodChange = (newPeriod: '7D' | '30D' | '90D' | '1Y') => {
    setPeriod(newPeriod);
  };

  const timeline = historyData?.timeline || [];
  const selectedPoint =
    selectedPointIndex !== null && timeline[selectedPointIndex]
      ? timeline[selectedPointIndex]
      : timeline[timeline.length - 1];

  const prices = timeline.map((t) => t.effectivePrice || t.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 100;
  const priceRange = maxPrice - minPrice || 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderBar title="Price History" subtitle={title} showBack={true} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchHistory(period, true)}
            tintColor="#2563EB"
            colors={['#0F172A', '#2563EB']}
          />
        }
      >
        {/* TIME PERIOD SELECTOR BAR */}
        <View style={styles.periodSelectorCard}>
          {(['7D', '30D', '90D', '1Y'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodTab, period === p && styles.activePeriodTab]}
              onPress={() => handlePeriodChange(p)}
              activeOpacity={0.75}
            >
              <Text style={[styles.periodText, period === p && styles.activePeriodText]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LOADING STATE */}
        {loading && !refreshing ? (
          <View style={styles.stateCenterBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.stateLoadingText}>Loading Price Analytics for {period}...</Text>
          </View>
        ) : null}

        {/* ERROR STATE */}
        {!loading && errorMessage ? (
          <View style={styles.stateErrorCard}>
            <GoogleIcon name="error-outline" size={36} color="#DC2626" style={{ marginBottom: 8 }} />
            <Text style={styles.stateErrorTitle}>Unable to Load Price History</Text>
            <Text style={styles.stateErrorSubtitle}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => fetchHistory(period)}
            >
              <Text style={styles.retryBtnText}>Retry Loading</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* SUCCESS DATA RENDERING */}
        {!loading && !errorMessage && historyData ? (
          <>
            {/* INSUFFICIENT DATA BANNER */}
            {!historyData.hasSufficientData ? (
              <View style={styles.insufficientBanner}>
                <GoogleIcon name="info" size={18} color="#2563EB" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.insufficientTitle}>Limited Historical Records</Text>
                  <Text style={styles.insufficientSubtitle}>
                    This item was recently indexed. Daily observations will populate trend charts automatically.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* STATS OVERVIEW CARDS (Current, Lowest, Average, Highest) */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Current Price</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(historyData.currentPrice)}
                </Text>
                <Text style={styles.statSubtitle}>Active Offer</Text>
              </View>

              <View style={styles.statBox}>
                <View style={styles.statHeaderRow}>
                  <Text style={styles.statLabel}>Lowest Price</Text>
                  <View style={styles.lowBadge}>
                    <Text style={styles.lowBadgeText}>BEST</Text>
                  </View>
                </View>
                <Text style={[styles.statValue, { color: '#2563EB' }]}>
                  {formatCurrency(historyData.lowestRecordedPrice)}
                </Text>
                <Text style={styles.statSubtitle}>All-Time Low</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Average Price</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(historyData.averagePrice)}
                </Text>
                <Text style={styles.statSubtitle}>{period} Average</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Highest Price</Text>
                <Text style={[styles.statValue, { color: '#9CA3AF' }]}>
                  {formatCurrency(historyData.highestRecordedPrice)}
                </Text>
                <Text style={styles.statSubtitle}>Peak Price</Text>
              </View>
            </View>

            {/* PERIOD DELTAS (7D, 30D, 90D Changes) */}
            <View style={styles.deltasCard}>
              <Text style={styles.deltasTitle}>Price Movement Trends</Text>
              <View style={styles.deltasRow}>
                {/* 7D Delta */}
                <View style={styles.deltaItem}>
                  <Text style={styles.deltaLabel}>7-Day Change</Text>
                  {historyData.change7d ? (
                    <View style={styles.deltaValueRow}>
                      <GoogleIcon
                        name={historyData.change7d.direction === 'DOWN' ? 'trending-down' : 'trending-up'}
                        size={16}
                        color={historyData.change7d.direction === 'DOWN' ? '#16A34A' : '#DC2626'}
                        style={{ marginRight: 2 }}
                      />
                      <Text
                        style={[
                          styles.deltaValue,
                          {
                            color:
                              historyData.change7d.direction === 'DOWN'
                                ? '#16A34A'
                                : '#DC2626',
                          },
                        ]}
                      >
                        {historyData.change7d.direction === 'DOWN' ? '-' : '+'}
                        {formatCurrency(historyData.change7d.amount)} ({historyData.change7d.percentage}%)
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.deltaNA}>Insufficient Data</Text>
                  )}
                </View>

                {/* 30D Delta */}
                <View style={styles.deltaItem}>
                  <Text style={styles.deltaLabel}>30-Day Change</Text>
                  {historyData.change30d ? (
                    <View style={styles.deltaValueRow}>
                      <GoogleIcon
                        name={historyData.change30d.direction === 'DOWN' ? 'trending-down' : 'trending-up'}
                        size={16}
                        color={historyData.change30d.direction === 'DOWN' ? '#16A34A' : '#DC2626'}
                        style={{ marginRight: 2 }}
                      />
                      <Text
                        style={[
                          styles.deltaValue,
                          {
                            color:
                              historyData.change30d.direction === 'DOWN'
                                ? '#16A34A'
                                : '#DC2626',
                          },
                        ]}
                      >
                        {historyData.change30d.direction === 'DOWN' ? '-' : '+'}
                        {formatCurrency(historyData.change30d.amount)} ({historyData.change30d.percentage}%)
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.deltaNA}>Insufficient Data</Text>
                  )}
                </View>
              </View>
            </View>

            {/* INTERACTIVE PRICE CHART */}
            <View style={styles.chartContainerCard}>
              <View style={styles.chartHeaderRow}>
                <View>
                  <Text style={styles.chartHeading}>Price Fluctuations</Text>
                  <Text style={styles.chartSubheading}>
                    Tap points to inspect historical date and store quotes
                  </Text>
                </View>
                {selectedPoint ? (
                  <View style={styles.pointTooltip}>
                    <Text style={styles.pointTooltipPrice}>
                      {formatCurrency(selectedPoint.effectivePrice || selectedPoint.price)}
                    </Text>
                    <Text style={styles.pointTooltipDate}>
                      {formatShortDate(selectedPoint.timestamp)} • {selectedPoint.retailer?.name || 'Amazon'}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Chart Canvas */}
              <View style={styles.graphContainer}>
                {/* Horizontal Gridlines */}
                <View style={styles.gridLinesOverlay}>
                  <View style={styles.gridLineRow}>
                    <Text style={styles.gridPriceLabel}>{formatCurrency(maxPrice)}</Text>
                    <View style={styles.gridLine} />
                  </View>
                  <View style={styles.gridLineRow}>
                    <Text style={styles.gridPriceLabel}>
                      {formatCurrency(Math.round((maxPrice + minPrice) / 2))}
                    </Text>
                    <View style={styles.gridLine} />
                  </View>
                  <View style={styles.gridLineRow}>
                    <Text style={styles.gridPriceLabel}>{formatCurrency(minPrice)}</Text>
                    <View style={styles.gridLine} />
                  </View>
                </View>

                {/* Bars & Interactive Points */}
                <View style={styles.barsContainer}>
                  {timeline.map((point, idx) => {
                    const priceVal = point.effectivePrice || point.price;
                    const normalizedHeight = Math.max(
                      15,
                      Math.min(95, Math.round(((priceVal - minPrice) / priceRange) * 75 + 20))
                    );
                    const isSelected = selectedPointIndex === idx;

                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.7}
                        onPress={() => setSelectedPointIndex(idx)}
                        style={styles.interactiveBarColumn}
                      >
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              { height: `${normalizedHeight}%` },
                              isSelected && styles.barFillSelected,
                              priceVal === minPrice && styles.barFillLowest,
                            ]}
                          />
                        </View>
                        <Text style={[styles.barDateLabel, isSelected && { color: '#0F172A', fontWeight: '800' }]}>
                          {formatShortDate(point.timestamp)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Chart Legend */}
              <View style={styles.chartLegendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#0F172A' }]} />
                  <Text style={styles.legendText}>Observed Quote</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
                  <Text style={styles.legendText}>Lowest Record</Text>
                </View>
              </View>
            </View>

            {/* HISTORICAL OBSERVATIONS LOG */}
            <Text style={styles.sectionHeader}>Historical Price Records</Text>
            <View style={styles.logCard}>
              {timeline.slice(0, 10).map((point, idx) => {
                const isLowestPoint = (point.effectivePrice || point.price) === minPrice;

                return (
                  <View
                    key={idx}
                    style={[
                      styles.logRow,
                      idx === Math.min(timeline.length, 10) - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.logLeft}>
                      <View style={styles.storeIconBox}>
                        <GoogleIcon name="storefront" size={16} color="#0F172A" />
                      </View>
                      <View>
                        <Text style={styles.logDate}>{formatShortDate(point.timestamp)}</Text>
                        <Text style={styles.logStore}>{point.retailer?.name || 'Authorized Store'}</Text>
                      </View>
                    </View>

                    <View style={styles.logRight}>
                      <Text style={[styles.logPrice, isLowestPoint && { color: '#2563EB' }]}>
                        {formatCurrency(point.effectivePrice || point.price)}
                      </Text>
                      {isLowestPoint ? (
                        <View style={styles.logLowBadge}>
                          <Text style={styles.logLowBadgeText}>LOWEST</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* SET ALERT SHORTCUT BUTTON */}
            <TouchableOpacity
              style={styles.alertBtn}
              onPress={() => navigation.navigate('Main', { screen: 'Alerts' })}
              activeOpacity={0.88}
            >
              <GoogleIcon name="add-alert" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.alertBtnText}>Track Price for this Item</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
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
  periodSelectorCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1.2,
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
  },
  activePeriodTab: {
    backgroundColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  activePeriodText: {
    color: '#FFFFFF',
  },
  stateCenterBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  stateLoadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  stateErrorCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FCA5A5',
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  stateErrorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 4,
  },
  stateErrorSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 14,
  },
  retryBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  insufficientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  insufficientTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  insufficientSubtitle: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
    lineHeight: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
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
  statHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  lowBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lowBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#2563EB',
  },
  deltasCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  deltasTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  deltasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  deltaItem: {
    flex: 1,
  },
  deltaLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  deltaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deltaValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  deltaNA: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  chartContainerCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 22,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  chartSubheading: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  pointTooltip: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  pointTooltipPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  pointTooltipDate: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '600',
  },
  graphContainer: {
    height: 140,
    position: 'relative',
    marginBottom: 10,
  },
  gridLinesOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  gridLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridPriceLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    width: 45,
    fontWeight: '600',
  },
  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  barsContainer: {
    position: 'absolute',
    left: 45,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  interactiveBarColumn: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    flex: 1,
  },
  barTrack: {
    height: '80%',
    width: 14,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 6,
  },
  barFillSelected: {
    backgroundColor: '#2563EB',
  },
  barFillLowest: {
    backgroundColor: '#3B82F6',
  },
  barDateLabel: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '600',
  },
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
    marginTop: 10,
    marginBottom: 8,
    marginLeft: 2,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  logStore: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  logRight: {
    alignItems: 'flex-end',
  },
  logPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  logLowBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: 2,
  },
  logLowBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#2563EB',
  },
  alertBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  alertBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
