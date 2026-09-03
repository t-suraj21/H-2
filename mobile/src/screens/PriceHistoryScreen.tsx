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
          // Default selected point to latest
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

  // Calculate chart min/max scaling
  const prices = timeline.map((t) => t.effectivePrice || t.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 100;
  const priceRange = maxPrice - minPrice || 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderBar title="Price History" subtitle={title} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchHistory(period, true)}
            tintColor={colors.brand.primaryGlow}
            colors={[colors.brand.primary]}
          />
        }
      >
        {/* ---------------------------------------------------- */}
        {/* TIME PERIOD SELECTOR BAR */}
        {/* ---------------------------------------------------- */}
        <View style={styles.periodSelectorCard}>
          {(['7D', '30D', '90D', '1Y'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodTab, period === p && styles.activePeriodTab]}
              onPress={() => handlePeriodChange(p)}
            >
              <Text style={[styles.periodText, period === p && styles.activePeriodText]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ---------------------------------------------------- */}
        {/* LOADING STATE */}
        {/* ---------------------------------------------------- */}
        {loading && !refreshing ? (
          <View style={styles.stateCenterBox}>
            <ActivityIndicator size="large" color={colors.brand.primaryGlow} />
            <Text style={styles.stateLoadingText}>Loading Price Analytics for {period}...</Text>
          </View>
        ) : null}

        {/* ---------------------------------------------------- */}
        {/* ERROR STATE */}
        {/* ---------------------------------------------------- */}
        {!loading && errorMessage ? (
          <Card variant="glass" style={styles.stateErrorCard}>
            <GoogleIcon name="error-outline" size={36} color={colors.status.error} style={{ marginBottom: spacing.sm }} />
            <Text style={styles.stateErrorTitle}>Unable to Load Price History</Text>
            <Text style={styles.stateErrorSubtitle}>{errorMessage}</Text>
            <Button
              title="Retry Loading"
              icon="refresh"
              variant="primary"
              onPress={() => fetchHistory(period)}
              style={styles.stateActionBtn}
            />
          </Card>
        ) : null}

        {/* ---------------------------------------------------- */}
        {/* SUCCESS DATA RENDERING */}
        {/* ---------------------------------------------------- */}
        {!loading && !errorMessage && historyData ? (
          <>
            {/* INSUFFICIENT DATA BANNER */}
            {!historyData.hasSufficientData ? (
              <View style={styles.insufficientBanner}>
                <GoogleIcon name="info-outline" size={18} color={colors.brand.cyan} style={{ marginRight: 8 }} />
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
              <Card variant="glass" style={styles.statBox}>
                <Text style={styles.statLabel}>Current Price</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(historyData.currentPrice)}
                </Text>
                <Text style={styles.statSubtitle}>Active Offer</Text>
              </Card>

              <Card variant="glass" style={styles.statBox}>
                <View style={styles.statHeaderRow}>
                  <Text style={styles.statLabel}>Lowest Price</Text>
                  <View style={styles.lowBadge}>
                    <Text style={styles.lowBadgeText}>BEST</Text>
                  </View>
                </View>
                <Text style={[styles.statValue, { color: colors.status.success }]}>
                  {formatCurrency(historyData.lowestRecordedPrice)}
                </Text>
                <Text style={styles.statSubtitle}>All-Time Low</Text>
              </Card>
            </View>

            <View style={styles.statsGrid}>
              <Card variant="glass" style={styles.statBox}>
                <Text style={styles.statLabel}>Average Price</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(historyData.averagePrice)}
                </Text>
                <Text style={styles.statSubtitle}>{period} Average</Text>
              </Card>

              <Card variant="glass" style={styles.statBox}>
                <Text style={styles.statLabel}>Highest Price</Text>
                <Text style={[styles.statValue, { color: colors.text.muted }]}>
                  {formatCurrency(historyData.highestRecordedPrice)}
                </Text>
                <Text style={styles.statSubtitle}>Peak Price</Text>
              </Card>
            </View>

            {/* PERIOD DELTAS (7D, 30D, 90D Changes) */}
            <Card variant="default" style={styles.deltasCard}>
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
                        color={historyData.change7d.direction === 'DOWN' ? colors.status.success : colors.status.error}
                        style={{ marginRight: 2 }}
                      />
                      <Text
                        style={[
                          styles.deltaValue,
                          {
                            color:
                              historyData.change7d.direction === 'DOWN'
                                ? colors.status.success
                                : colors.status.error,
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
                        color={historyData.change30d.direction === 'DOWN' ? colors.status.success : colors.status.error}
                        style={{ marginRight: 2 }}
                      />
                      <Text
                        style={[
                          styles.deltaValue,
                          {
                            color:
                              historyData.change30d.direction === 'DOWN'
                                ? colors.status.success
                                : colors.status.error,
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
            </Card>

            {/* INTERACTIVE PRICE CHART */}
            <Card variant="elevated" style={styles.chartContainerCard}>
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

              {/* Chart Canvas with scrubbable bars & nodes */}
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
                        <Text
                          style={[
                            styles.barDateLabel,
                            isSelected && { color: colors.brand.primaryGlow, fontWeight: '700' },
                          ]}
                          numberOfLines={1}
                        >
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
                  <View style={[styles.legendDot, { backgroundColor: colors.status.success }]} />
                  <Text style={styles.legendText}>Lowest ({formatCurrency(minPrice)})</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.brand.primaryGlow }]} />
                  <Text style={styles.legendText}>Selected Observation</Text>
                </View>
              </View>
            </Card>

            {/* HISTORICAL OBSERVATIONS LOG */}
            <Text style={styles.sectionHeader}>Historical Observations Log</Text>
            <Card variant="default" style={styles.logCard}>
              {timeline
                .slice()
                .reverse()
                .map((log, idx) => (
                  <View key={idx} style={styles.logRow}>
                    <View style={styles.logLeft}>
                      <View style={styles.storeIconBox}>
                        <GoogleIcon name="storefront" size={16} color={colors.brand.primaryGlow} />
                      </View>
                      <View>
                        <Text style={styles.logDate}>{formatShortDate(log.timestamp)}</Text>
                        <Text style={styles.logStore}>{log.retailer?.name || 'Authorized Store'}</Text>
                      </View>
                    </View>

                    <View style={styles.logRight}>
                      <Text style={styles.logPrice}>
                        {formatCurrency(log.effectivePrice || log.price)}
                      </Text>
                      {log.effectivePrice === minPrice ? (
                        <View style={styles.logLowBadge}>
                          <Text style={styles.logLowBadgeText}>ALL-TIME LOW</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
            </Card>

            {/* SET ALERT SHORTCUT */}
            <Button
              title="Set Price Drop Alert for this Product"
              icon="notifications-active"
              variant="primary"
              onPress={() => navigation.navigate('Main', { screen: 'Alerts' })}
              style={styles.alertBtn}
            />
          </>
        ) : null}
      </ScrollView>
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
  periodSelectorCard: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderColor: colors.border.subtle,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 3,
    marginBottom: spacing.md,
  },
  periodTab: {
    flex: 1,
    paddingVertical: spacing.sm - 2,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  activePeriodTab: {
    backgroundColor: colors.brand.primary,
  },
  periodText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
    fontWeight: typography.fontWeights.semibold,
  },
  activePeriodText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
  stateCenterBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  stateLoadingText: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  stateErrorCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginVertical: spacing.md,
  },
  stateErrorTitle: {
    fontSize: typography.fontSizes.md + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.status.error,
    marginBottom: spacing.xs,
  },
  stateErrorSubtitle: {
    fontSize: typography.fontSizes.xs + 1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  stateActionBtn: {
    width: '100%',
  },
  insufficientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  insufficientTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.cyan,
  },
  insufficientSubtitle: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.secondary,
    marginTop: 2,
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statBox: {
    flex: 1,
    padding: spacing.md,
  },
  statHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.muted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  lowBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radii.xs,
  },
  lowBadgeText: {
    fontSize: 8,
    color: colors.status.success,
    fontWeight: '800',
  },
  statValue: {
    fontSize: typography.fontSizes.md + 1,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.text.primary,
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 9,
    color: colors.text.muted,
    marginTop: 2,
  },
  deltasCard: {
    marginVertical: spacing.sm,
  },
  deltasTitle: {
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
  deltasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  deltaItem: {
    flex: 1,
  },
  deltaLabel: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.muted,
    marginBottom: 3,
  },
  deltaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deltaValue: {
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.bold,
  },
  deltaNA: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  chartContainerCard: {
    marginVertical: spacing.md,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  chartHeading: {
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  chartSubheading: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.muted,
    marginTop: 1,
  },
  pointTooltip: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderColor: colors.border.brand,
    borderWidth: 1,
  },
  pointTooltipPrice: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primaryGlow,
  },
  pointTooltipDate: {
    fontSize: 9,
    color: colors.text.secondary,
  },
  graphContainer: {
    height: 180,
    backgroundColor: colors.background.secondary,
    borderRadius: radii.md,
    position: 'relative',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  gridLinesOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  gridLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridPriceLabel: {
    fontSize: 8,
    color: colors.text.muted,
    width: 48,
  },
  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.subtle,
    opacity: 0.3,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 48,
    zIndex: 1,
  },
  interactiveBarColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.4)',
    borderTopLeftRadius: radii.xs,
    borderTopRightRadius: radii.xs,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  barFillSelected: {
    backgroundColor: colors.brand.primaryGlow,
    borderColor: '#FFFFFF',
    width: 16,
  },
  barFillLowest: {
    backgroundColor: colors.status.success,
    borderColor: colors.status.success,
  },
  barDateLabel: {
    fontSize: 8,
    color: colors.text.muted,
    marginTop: 4,
  },
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.secondary,
  },
  sectionHeader: {
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  logCard: {
    marginBottom: spacing.lg,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  logDate: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
  logStore: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.muted,
    marginTop: 1,
  },
  logRight: {
    alignItems: 'flex-end',
  },
  logPrice: {
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  logLowBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radii.xs,
    marginTop: 2,
  },
  logLowBadgeText: {
    fontSize: 7,
    fontWeight: '800',
    color: colors.status.success,
  },
  alertBtn: {
    marginBottom: spacing.xl,
  },
});
