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
    } catch {
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
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      {/* Screen Title Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Price Drop Alerts</Text>
          <Text style={styles.headerSubtitle}>
            Instant notifications when prices dip below your target
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => fetchAlerts(true)}
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
            onRefresh={() => fetchAlerts(true)}
            tintColor="#2563EB"
            colors={['#0F172A', '#2563EB']}
          />
        }
      >
        {/* Create New Alert CTA Banner */}
        {!showCreateModal ? (
          <TouchableOpacity
            style={styles.addTriggerBanner}
            activeOpacity={0.85}
            onPress={() => setShowCreateModal(true)}
          >
            <View style={styles.addIconCircle}>
              <GoogleIcon name="add-alert" size={20} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.addBannerTitle}>Set New Price Drop Alert</Text>
              <Text style={styles.addBannerSub}>
                e.g. &quot;Notify me when price drops below ₹22,000&quot;
              </Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.createCard}>
            <View style={styles.createHeaderRow}>
              <GoogleIcon name="notifications-active" size={20} color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.createTitle}>Create Price Threshold Alert</Text>
            </View>

            <Text style={styles.inputLabel}>Product Title / Model</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sony WH-1000XM5 Headphones"
              placeholderTextColor="#9CA3AF"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.inputLabel}>Brand (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sony, Apple, Samsung"
              placeholderTextColor="#9CA3AF"
              value={newBrand}
              onChangeText={setNewBrand}
            />

            <Text style={styles.inputLabel}>Target Price Threshold (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 22000"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={newTargetPrice}
              onChangeText={setNewTargetPrice}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCreateModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreateAlert}
                disabled={creating}
                activeOpacity={0.88}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.modalSubmitInner}>
                    <GoogleIcon name="notifications-active" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.modalSubmitText}>Set Alert</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Filter Chips Bar */}
        <View style={styles.filterRow}>
          {(
            [
              { key: 'ALL', label: 'All Alerts' },
              { key: 'ACTIVE', label: '⏳ Active' },
              { key: 'TRIGGERED', label: '🎉 Target Met' },
            ] as const
          ).map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.activeFilterChip]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.75}
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
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Syncing Price Drop Triggers...</Text>
          </View>
        ) : null}

        {/* Empty State */}
        {!loading && filteredAlerts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <GoogleIcon name="notifications-none" size={32} color="#2563EB" />
            </View>
            <Text style={styles.emptyTitle}>No Price Alerts Found</Text>
            <Text style={styles.emptyDesc}>
              Set up price drop alerts to get notified instantly when market prices dip below your budget.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.88}
            >
              <View style={styles.emptyBtnInner}>
                <GoogleIcon name="add-alert" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyBtnText}>Create Target Alert</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Alerts List */}
        {!loading &&
          filteredAlerts.map((alert) => {
            const isTriggered = alert.status === 'TRIGGERED' || alert.triggered;

            return (
              <View key={alert.id} style={styles.alertCard}>
                {/* Target Met Celebratory Banner */}
                {isTriggered ? (
                  <View style={styles.triggeredBanner}>
                    <GoogleIcon name="celebration" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                    <Text style={styles.triggeredText}>
                      Target Price Met! Current price ({formatPrice(alert.triggeredPrice || alert.currentPrice)}) is at or below target ({formatPrice(alert.targetPrice)}).
                    </Text>
                  </View>
                ) : null}

                {/* Top Header Row with Status Badge */}
                <View style={styles.alertHeaderRow}>
                  <View style={[styles.statusBadge, isTriggered && styles.statusBadgeTriggered]}>
                    <GoogleIcon
                      name={isTriggered ? 'check-circle' : 'schedule'}
                      size={13}
                      color={isTriggered ? '#2563EB' : '#0F172A'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        isTriggered && styles.statusTextTriggered,
                      ]}
                    >
                      {isTriggered ? 'TRIGGERED' : 'MONITORING'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeleteAlert(alert)}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <GoogleIcon name="delete-outline" size={18} color="#94A3B8" />
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
                    <Text style={styles.priceMatrixLabel}>Target Below</Text>
                    <Text style={styles.priceMatrixValueTarget}>
                      {formatPrice(alert.targetPrice)}
                    </Text>
                  </View>

                  <View style={styles.priceMatrixDivider} />

                  <View style={styles.priceMatrixCol}>
                    <Text style={styles.priceMatrixLabel}>Active Market Price</Text>
                    <Text style={styles.priceMatrixValueCurrent}>
                      {formatPrice(alert.currentPrice)}
                    </Text>
                  </View>
                </View>

                {/* Card Actions */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.primaryCardBtn}
                    onPress={() =>
                      navigation.navigate('ProductComparison', {
                        title: alert.title,
                        category: alert.category,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <GoogleIcon name="compare-arrows" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryCardBtnText}>Compare Stores</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryCardBtn}
                    onPress={() =>
                      navigation.navigate('PriceHistory', {
                        productId: alert.productId || alert.id,
                        title: alert.title,
                        currentPrice: alert.currentPrice,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <GoogleIcon name="show-chart" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                    <Text style={styles.secondaryCardBtnText}>Price History</Text>
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
  addTriggerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  addIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  addBannerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  createCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  createHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  createTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 12,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubmitBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
  alertCard: {
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
  triggeredBanner: {
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
  triggeredText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    flex: 1,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeTriggered: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  statusTextTriggered: {
    color: '#2563EB',
  },
  deleteBtn: {
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
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 19,
    marginBottom: 2,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  priceMatrixBox: {
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
  priceMatrixCol: {
    alignItems: 'center',
    flex: 1,
  },
  priceMatrixLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  priceMatrixValueTarget: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  priceMatrixValueCurrent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  priceMatrixDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#E2E8F0',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryCardBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCardBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryCardBtn: {
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
  secondaryCardBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
});
