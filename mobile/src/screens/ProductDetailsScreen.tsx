import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../theme';
import { HeaderBar } from '../components/common/HeaderBar';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { RootStackScreenProps } from '../navigation/types';

export const ProductDetailsScreen: React.FC<RootStackScreenProps<'ProductDetails'>> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { title = 'Sony WH-1000XM5', price = 24999 } = route.params || {};
  const [inWatchlist, setInWatchlist] = useState(false);

  const specifications = [
    { label: 'Brand', value: 'Sony' },
    { label: 'Model', value: 'WH-1000XM5' },
    { label: 'Battery Life', value: 'Up to 30 Hours ANC' },
    { label: 'Noise Canceling', value: 'Industry Leading Active (Dual Chip)' },
    { label: 'Connectivity', value: 'Bluetooth 5.2, Multipoint' },
    { label: 'Weight', value: '250 grams' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderBar
        title="Product Details"
        showBack={true}
        rightAction={{
          icon: inWatchlist ? 'bookmark' : 'bookmark-border',
          label: inWatchlist ? 'Saved' : 'Save',
          onPress: () => setInWatchlist(!inWatchlist),
        }}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image Emblem */}
        <View style={styles.imageContainer}>
          <View style={styles.imageEmblem}>
            <GoogleIcon name="headphones" size={54} color="#0F172A" />
          </View>
          <View style={styles.verifiedTag}>
            <GoogleIcon name="verified" size={13} color="#2563EB" style={{ marginRight: 4 }} />
            <Text style={styles.verifiedText}>HL² VERIFIED DEAL</Text>
          </View>
        </View>

        {/* Title & Pricing Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.brandTag}>
            <Text style={styles.brandSubtitle}>SONY AUDIO</Text>
          </View>
          <Text style={styles.productTitle}>{title}</Text>

          <View style={styles.ratingRow}>
            <View style={styles.starRow}>
              <GoogleIcon name="star" size={14} color="#F59E0B" />
              <GoogleIcon name="star" size={14} color="#F59E0B" />
              <GoogleIcon name="star" size={14} color="#F59E0B" />
              <GoogleIcon name="star" size={14} color="#F59E0B" />
              <GoogleIcon name="star" size={14} color="#F59E0B" />
            </View>
            <Text style={styles.ratingCount}>4.8 (12,480+ Reviews)</Text>
          </View>

          <View style={styles.priceDivider} />

          <View style={styles.priceOverview}>
            <View>
              <Text style={styles.bestPriceLabel}>Lowest Available Price</Text>
              <Text style={styles.bestPrice}>₹{price.toLocaleString('en-IN')}</Text>
              <Text style={styles.msrpPrice}>MRP ₹29,990 (Save ₹4,991)</Text>
            </View>

            <View style={styles.scoreContainer}>
              <Text style={styles.scoreTitle}>DEAL SCORE</Text>
              <Text style={styles.scoreValue}>94/100</Text>
              <Text style={styles.scoreLabel}>Authentic</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() =>
              navigation.navigate('PriceHistory', {
                productId: route.params?.productId || 'p1',
                title,
                currentPrice: price,
              })
            }
            activeOpacity={0.88}
          >
            <GoogleIcon name="show-chart" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>View Price History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() =>
              navigation.navigate('ProductComparison', {
                title,
                category: 'Headphones & Audio',
              })
            }
            activeOpacity={0.88}
          >
            <GoogleIcon name="compare-arrows" size={18} color="#0F172A" style={{ marginRight: 8 }} />
            <Text style={styles.secondaryBtnText}>Compare Across Stores</Text>
          </TouchableOpacity>
        </View>

        {/* Key Specifications */}
        <Text style={styles.sectionHeader}>Key Specifications</Text>
        <View style={styles.specsCard}>
          {specifications.map((spec, index) => (
            <View
              key={index}
              style={[
                styles.specRow,
                index === specifications.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Text style={styles.specLabel}>{spec.label}</Text>
              <Text style={styles.specValue}>{spec.value}</Text>
            </View>
          ))}
        </View>

        {/* Price Drop Tracker Alert */}
        <View style={styles.alertCard}>
          <View style={styles.alertHeaderRow}>
            <GoogleIcon name="notifications-active" size={18} color="#2563EB" style={{ marginRight: 6 }} />
            <Text style={styles.alertTitle}>Track this Product</Text>
          </View>
          <Text style={styles.alertDesc}>
            Get automated mobile alerts if this item drops below your target price threshold.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Main', { screen: 'Alerts' })}
            activeOpacity={0.88}
          >
            <GoogleIcon name="add-alert" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.primaryBtnText}>Set Price Drop Alert</Text>
          </TouchableOpacity>
        </View>
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
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imageEmblem: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.8,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  brandTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.8,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    lineHeight: 22,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  starRow: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  priceOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bestPriceLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bestPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  msrpPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  scoreTitle: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#1D4ED8',
    fontWeight: '700',
  },
  actionRow: {
    gap: 10,
    marginBottom: 20,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 2,
  },
  specsCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  specValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  alertCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  alertDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 18,
  },
});
