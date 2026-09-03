import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  const { title = 'Sony WH-1000XM5', price = 328.0 } = route.params || {};
  const [inWatchlist, setInWatchlist] = useState(false);

  const specifications = [
    { label: 'Brand', value: 'Sony' },
    { label: 'Model', value: 'WH-1000XM5' },
    { label: 'Battery Life', value: 'Up to 30 Hours' },
    { label: 'Noise Canceling', value: 'Industry Leading Active (Dual Chip)' },
    { label: 'Connectivity', value: 'Bluetooth 5.2, Multipoint' },
    { label: 'Weight', value: '250 grams' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderBar
        title="Product Details"
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
            <GoogleIcon name="headphones" size={54} color={colors.brand.primaryGlow} />
          </View>
          <View style={styles.verifiedTag}>
            <GoogleIcon name="verified" size={13} color={colors.status.success} style={{ marginRight: 4 }} />
            <Text style={styles.verifiedText}>HL² VERIFIED DEAL</Text>
          </View>
        </View>

        {/* Title & Pricing Overview */}
        <Card variant="glass" style={styles.overviewCard}>
          <Text style={styles.brandSubtitle}>SONY AUDIO</Text>
          <Text style={styles.productTitle}>{title}</Text>

          <View style={styles.ratingRow}>
            <View style={styles.starRow}>
              <GoogleIcon name="star" size={14} color={colors.brand.amber} />
              <GoogleIcon name="star" size={14} color={colors.brand.amber} />
              <GoogleIcon name="star" size={14} color={colors.brand.amber} />
              <GoogleIcon name="star" size={14} color={colors.brand.amber} />
              <GoogleIcon name="star" size={14} color={colors.brand.amber} />
            </View>
            <Text style={styles.ratingCount}>4.8 (12,480+ Reviews)</Text>
          </View>

          <View style={styles.priceDivider} />

          <View style={styles.priceOverview}>
            <View>
              <Text style={styles.bestPriceLabel}>Lowest Available Price</Text>
              <Text style={styles.bestPrice}>${price.toFixed(2)}</Text>
              <Text style={styles.msrpPrice}>MSRP $399.99 (Save $71.99)</Text>
            </View>

            <View style={styles.scoreContainer}>
              <Text style={styles.scoreTitle}>DEAL SCORE</Text>
              <Text style={styles.scoreValue}>94/100</Text>
              <Text style={styles.scoreLabel}>Authentic</Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Button
            title="View Price History"
            icon="show-chart"
            variant="primary"
            onPress={() =>
              navigation.navigate('PriceHistory', {
                productId: route.params?.productId || 'p1',
                title,
                currentPrice: price,
              })
            }
            style={styles.actionBtn}
          />
          <Button
            title="Compare Retailers"
            icon="compare-arrows"
            variant="secondary"
            onPress={() =>
              navigation.navigate('ProductComparison', {
                category: 'Headphones',
              })
            }
            style={styles.actionBtn}
          />
        </View>

        {/* Technical Specifications */}
        <Text style={styles.sectionHeader}>Verified Specifications</Text>
        <Card variant="default" style={styles.specsCard}>
          {specifications.map((spec, idx) => (
            <View key={idx} style={styles.specRow}>
              <Text style={styles.specLabel}>{spec.label}</Text>
              <Text style={styles.specValue}>{spec.value}</Text>
            </View>
          ))}
        </Card>

        {/* Watchlist & Alerts Trigger */}
        <Card variant="elevated" style={styles.alertCard}>
          <Text style={styles.alertTitle}>Track this item</Text>
          <Text style={styles.alertDesc}>
            Receive automatic push notifications when this item drops below your target price.
          </Text>
          <Button
            title="Create Price Alert"
            icon="notifications-active"
            variant="accent"
            onPress={() => navigation.navigate('Main', { screen: 'Alerts' })}
            style={styles.alertBtn}
          />
        </Card>
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
    paddingTop: spacing.xs,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  imageEmblem: {
    width: 110,
    height: 110,
    borderRadius: radii.xl,
    backgroundColor: colors.background.card,
    borderColor: colors.border.brand,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.border.success,
    borderWidth: 1,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  verifiedText: {
    color: colors.status.success,
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.8,
  },
  overviewCard: {
    marginBottom: spacing.md,
  },
  brandSubtitle: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.brand.cyan,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  productTitle: {
    fontSize: typography.fontSizes.md + 2,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  starRow: {
    flexDirection: 'row',
    marginRight: spacing.xs,
  },
  ratingCount: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
  },
  priceDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.sm,
  },
  priceOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bestPriceLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
  },
  bestPrice: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.status.success,
  },
  msrpPrice: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: colors.border.brand,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  scoreTitle: {
    fontSize: 9,
    color: colors.brand.cyan,
    fontWeight: '800',
  },
  scoreValue: {
    fontSize: typography.fontSizes.md + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  scoreLabel: {
    fontSize: 10,
    color: colors.status.success,
    fontWeight: '600',
  },
  actionRow: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    width: '100%',
  },
  sectionHeader: {
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: spacing.sm,
  },
  specsCard: {
    marginBottom: spacing.lg,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  specLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
  },
  specValue: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.primary,
    fontWeight: typography.fontWeights.medium,
  },
  alertCard: {
    marginBottom: spacing.lg,
  },
  alertTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  alertDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  alertBtn: {
    width: '100%',
  },
});
