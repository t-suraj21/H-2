import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../theme';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { alertApi, PriceAlertItem } from '../services/productApi';
import { useAuth } from '../context/AuthContext';
import { MainTabScreenProps } from '../navigation/types';

const formatPrice = (price?: number | null) => {
  if (price === undefined || price === null) return 'N/A';
  return `₹${price.toLocaleString('en-IN')}`;
};

export const PriceAlertsScreen: React.FC<MainTabScreenProps<'Alerts'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { token, isAuthenticated } = useAuth();

  const [alerts, setAlerts] = useState<PriceAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'TRIGGERED'>('ALL');

  // New alert form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newTargetPrice, setNewTargetPrice] = useState('');
  const [creating, setCreating] = useState(false);

  // Initial mock alerts for non-authenticated or demo state
  const mockAlerts: PriceAlertItem[] = [
    {
      id: 'mock-alert-1',
      productId: 'p1',
      title: 'Sony WH-1000XM5 Wireless Headphones',
      brand: 'Sony',
      model: 'WH-1000XM5',
      category: 'Headphones & Audio',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
      targetPrice: 22000,
      currentPrice: 24999,
      status: 'ACTIVE',
      triggered: false,
      isTargetMet: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mock-alert-2',
      productId: 'p2',
      title: 'Apple MacBook Air M3 (16GB RAM, 512GB SSD)',
      brand: 'Apple',
      model: 'MacBook Air M3',
      category: 'Computers & Laptops',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
      targetPrice: 115000,
      currentPrice: 114900,
      status: 'TRIGGERED',
      triggered: true,
      triggeredAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      triggeredPrice: 114900,
      isTargetMet: true,
      createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    },
  ];

  const fetchAlerts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      if (isAuthenticated && token) {
        const res = await alertApi.getAlerts(token);
        if (res.success && Array.isArray(res.data)) {
          setAlerts(res.data);
        } else {
          setAlerts(mockAlerts);
        }
      } else {
        setAlerts(mockAlerts);
      }
    } catch {
      setAlerts(mockAlerts);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleCreateAlert = async () => {
    const targetNum = parseFloat(newTargetPrice);
    if (!newTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a product title or model name.');
      return;
    }
    if (isNaN(targetNum) || targetNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid target price greater than 0.');
      return;
    }

    if (!isAuthenticated || !token) {
      // Local optimistic addition for unauthenticated session
      const localAlert: PriceAlertItem = {
        id: `local-${Date.now()}`,
        productId: `p-${Date.now()}`,
        title: newTitle.trim(),
        brand: newBrand.trim() || 'Generic',
        model: 'Standard',
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
        targetPrice: targetNum,
        currentPrice: Math.round(targetNum * 1.12),
        status: 'ACTIVE',
        triggered: false,
        isTargetMet: false,
        createdAt: new Date().toISOString(),
      };
      setAlerts([localAlert, ...alerts]);
      setNewTitle('');
      setNewBrand('');
      setNewTargetPrice('');
      setShowCreateModal(false);
      return;
    }

    setCreating(true);
    try {
      const res = await alertApi.createAlert(
        {
          targetPrice: targetNum,
          productData: {
            title: newTitle.trim(),
            brand: newBrand.trim() || 'Generic',
            price: Math.round(targetNum * 1.12),
          },
        },
        token
      );

      if (res.success) {
        Alert.alert('Price Alert Set', res.message || 'Alert configured successfully.');
        setNewTitle('');
        setNewBrand('');
        setNewTargetPrice('');
        setShowCreateModal(false);
        fetchAlerts(true);
      } else {
        Alert.alert('Error', res.message || 'Failed to create price alert.');
      }
    } catch (err) {
      Alert.alert('Network Error', 'Could not create price alert.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAlert = async (item: PriceAlertItem) => {
    Alert.alert(
      'Delete Price Alert',
      `Delete price drop alert for "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setAlerts((prev) => prev.filter((a) => a.id !== item.id));

            if (isAuthenticated && token) {
              await alertApi.deleteAlert(item.id, token);
            }
          },
        },
      ]
    );
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ACTIVE') return a.status === 'ACTIVE';
    if (filter === 'TRIGGERED') return a.status === 'TRIGGERED' || a.triggered;
    return true;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Screen Title Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Price Drop Alerts</Text>
          <Text style={styles.headerSubtitle}>
            Get notified immediately when prices hit your target
          </Text>
        </View>
        <TouchableOpacity onPress={() => fetchAlerts(true)} style={styles.refreshBtn}>
          <GoogleIcon name="sync" size={20} color={colors.brand.primaryGlow} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAlerts(true)}
            tintColor={colors.brand.primaryGlow}
            colors={[colors.brand.primary]}
          />
        }
      >
        {/* Create New Alert CTA Banner */}
        {!showCreateModal ? (
          <TouchableOpacity
            style={styles.addTriggerBanner}
            activeOpacity={0.8}
            onPress={() => setShowCreateModal(true)}
          >
            <View style={styles.addIconCircle}>
              <GoogleIcon name="add-alert" size={22} color={colors.brand.primaryGlow} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.addBannerTitle}>Set New Price Drop Alert</Text>
              <Text style={styles.addBannerSub}>
                e.g. &quot;Notify me when price falls below ₹22,000&quot;
              </Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color={colors.text.muted} />
          </TouchableOpacity>
        ) : (
          <Card variant="elevated" style={styles.createCard}>
            <View style={styles.createHeaderRow}>
              <GoogleIcon name="notifications-active" size={20} color={colors.brand.primaryGlow} style={{ marginRight: 6 }} />
              <Text style={styles.createTitle}>Create Price Threshold Alert</Text>
            </View>

            <Text style={styles.inputLabel}>Product Name or Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sony WH-1000XM5 Headphones"
              placeholderTextColor={colors.text.muted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.inputLabel}>Brand (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sony, Apple, Samsung"
              placeholderTextColor={colors.text.muted}
              value={newBrand}
              onChangeText={setNewBrand}
            />

            <Text style={styles.inputLabel}>Target Price Threshold (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 22000"
              placeholderTextColor={colors.text.muted}
              keyboardType="numeric"
              value={newTargetPrice}
              onChangeText={setNewTargetPrice}
            />

            <View style={styles.modalButtonsRow}>
              <Button
                title="Cancel"
                variant="secondary"
                size="sm"
                onPress={() => setShowCreateModal(false)}
                style={styles.modalBtn}
              />
              <Button
                title={creating ? 'Saving...' : 'Set Alert'}
                icon="notifications-active"
                variant="primary"
                size="sm"
                onPress={handleCreateAlert}
                disabled={creating}
                style={styles.modalBtn}
              />
            </View>
          </Card>
        )}

        {/* Filter Chips Bar */}
        <View style={styles.filterRow}>
          {(
            [
              { key: 'ALL', label: 'All Alerts' },
              { key: 'ACTIVE', label: '⏳ Active Triggers' },
              { key: 'TRIGGERED', label: '🎉 Target Met' },
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
            <Text style={styles.loadingText}>Syncing Price Drop Triggers...</Text>
          </View>
        ) : null}

        {/* Empty State */}
        {!loading && filteredAlerts.length === 0 ? (
          <Card variant="default" style={styles.emptyCard}>
            <GoogleIcon
              name="notifications-none"
              size={48}
              color={colors.text.muted}
              style={{ marginBottom: spacing.sm }}
            />
            <Text style={styles.emptyTitle}>No Price Alerts Found</Text>
            <Text style={styles.emptyDesc}>
              Set up price drop alerts to get notified instantly when market prices dip below your target.
            </Text>
            <Button
              title="Create Target Alert"
              icon="add-alert"
              variant="primary"
              onPress={() => setShowCreateModal(true)}
              style={styles.emptyBtn}
            />
          </Card>
        ) : null}

        {/* Alerts List */}
        {!loading &&
          filteredAlerts.map((alert) => {
            const isTriggered = alert.status === 'TRIGGERED' || alert.triggered;

            return (
              <Card key={alert.id} variant="default" style={styles.alertCard}>
                {/* Target Met Celebratory Banner */}
                {isTriggered ? (
                  <View style={styles.triggeredBanner}>
                    <GoogleIcon name="celebration" size={16} color={colors.status.success} style={{ marginRight: 6 }} />
                    <Text style={styles.triggeredText}>
                      Target Price Met! Current price ({formatPrice(alert.triggeredPrice || alert.currentPrice)}) is below target ({formatPrice(alert.targetPrice)}).
                    </Text>
                  </View>
                ) : null}

                {/* Top Header Row with Status Badge */}
                <View style={styles.alertHeaderRow}>
                  <View style={styles.statusBadge}>
                    <GoogleIcon
                      name={isTriggered ? 'check-circle' : 'schedule'}
                      size={14}
                      color={isTriggered ? colors.status.success : colors.brand.cyan}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: isTriggered ? colors.status.success : colors.brand.cyan },
                      ]}
                    >
                      {isTriggered ? 'TRIGGERED' : 'MONITORING'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeleteAlert(alert)}
                    style={styles.deleteBtn}
                  >
                    <GoogleIcon name="delete-outline" size={18} color={colors.text.muted} />
                  </TouchableOpacity>
                </View>

                {/* Product Info Row */}
                <View style={styles.productRow}>
                  <View style={styles.thumbnailBox}>
                    <Image
                      source={{ uri: alert.image }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.titleBox}>
                    <Text style={styles.productTitle} numberOfLines={2}>
                      {alert.title}
                    </Text>
                    <Text style={styles.brandSubtitle}>
                      {alert.brand} • {alert.category}
                    </Text>
                  </View>
                </View>

                {/* Target vs Current Price Comparison Box */}
                <View style={styles.priceMatrixBox}>
                  <View style={styles.priceMatrixCol}>
                    <Text style={styles.priceMatrixLabel}>Notify When Below</Text>
                    <Text style={[styles.priceMatrixValue, { color: colors.status.success }]}>
                      {formatPrice(alert.targetPrice)}
                    </Text>
                  </View>

                  <View style={styles.priceMatrixDivider} />

                  <View style={styles.priceMatrixCol}>
                    <Text style={styles.priceMatrixLabel}>Active Market Price</Text>
                    <Text style={[styles.priceMatrixValue, { color: colors.text.primary }]}>
                      {formatPrice(alert.currentPrice)}
                    </Text>
                  </View>
                </View>

                {/* Card Actions */}
                <View style={styles.cardActionsRow}>
                  <Button
                    title="Compare Stores"
                    icon="compare-arrows"
                    variant="primary"
                    size="sm"
                    onPress={() =>
                      navigation.navigate('ProductComparison', {
                        title: alert.title,
                        category: alert.category,
                      })
                    }
                    style={styles.cardBtn}
                  />
                  <Button
                    title="Price History"
                    icon="show-chart"
                    variant="secondary"
                    size="sm"
                    onPress={() =>
                      navigation.navigate('PriceHistory', {
                        productId: alert.productId || alert.id,
                        title: alert.title,
                        currentPrice: alert.currentPrice,
                      })
                    }
                    style={styles.cardBtn}
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
  addTriggerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: colors.border.brand,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  addIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  addBannerTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primaryGlow,
  },
  addBannerSub: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.muted,
    marginTop: 2,
  },
  createCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  createHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  createTitle: {
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  inputLabel: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.muted,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.background.input,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm - 2,
    color: colors.text.primary,
    fontSize: typography.fontSizes.sm,
    marginBottom: spacing.sm,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modalBtn: {
    flex: 1,
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
  alertCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  triggeredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.border.success,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  triggeredText: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: colors.status.success,
    fontWeight: typography.fontWeights.bold,
    lineHeight: 16,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  thumbnailBox: {
    width: 44,
    height: 44,
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
  productTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    lineHeight: 18,
  },
  brandSubtitle: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  priceMatrixBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginVertical: spacing.sm,
  },
  priceMatrixCol: {
    flex: 1,
    alignItems: 'center',
  },
  priceMatrixLabel: {
    fontSize: 9,
    color: colors.text.muted,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  priceMatrixValue: {
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.extraBold,
  },
  priceMatrixDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.subtle,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  cardBtn: {
    flex: 1,
  },
});
