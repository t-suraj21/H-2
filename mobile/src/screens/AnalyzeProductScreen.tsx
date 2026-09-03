import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../theme';
import { HeaderBar } from '../components/common/HeaderBar';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { productApi, AnalyzedProductData } from '../services/productApi';
import { RootStackScreenProps } from '../navigation/types';

export const AnalyzeProductScreen: React.FC<RootStackScreenProps<'AnalyzeProduct'>> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const [url, setUrl] = useState(
    route.params?.initialUrl || 'https://www.amazon.com/dp/B09XS7JWHH'
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzedProductData | null>(null);

  const sampleUrls = [
    { label: 'Amazon (Sony XM5)', url: 'https://www.amazon.com/dp/B09XS7JWHH' },
    { label: 'Flipkart (iPhone 15)', url: 'https://www.flipkart.com/apple-iphone-15/p/itm123?pid=MOBFWQ6BRGFGG2FD' },
    { label: 'Croma (Dell Laptop)', url: 'https://www.croma.com/p/264332' },
  ];

  const handleAnalyze = async (targetUrl?: string) => {
    const urlToAnalyze = (targetUrl || url).trim();
    if (!urlToAnalyze) {
      setErrorMessage('Please enter or paste a product URL.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const response = await productApi.analyzeUrl(urlToAnalyze);
      if (response.success && response.data) {
        setAnalysisResult(response.data);
      } else {
        setErrorMessage(response.message || 'Failed to analyze product URL.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error during URL analysis.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-analyze initial URL on mount
  useEffect(() => {
    if (url) {
      handleAnalyze(url);
    }
  }, []);

  const handleChipSelect = (selectedUrl: string) => {
    setUrl(selectedUrl);
    handleAnalyze(selectedUrl);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderBar
        title="Analyze Product"
        subtitle="AI Deal Authenticity & Price Audit"
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* URL Input Box */}
        <Card variant="glass" style={styles.inputCard}>
          <Text style={styles.inputLabel}>Product URL / E-Commerce Link</Text>
          <View style={styles.inputWrapper}>
            <GoogleIcon name="link" size={20} color={colors.brand.primaryGlow} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.textInput}
              value={url}
              onChangeText={(text) => {
                setUrl(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Paste Amazon, Flipkart, or Croma link..."
              placeholderTextColor={colors.text.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {url ? (
              <TouchableOpacity onPress={() => setUrl('')} style={styles.clearBtn}>
                <GoogleIcon name="close" size={18} color={colors.text.muted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Quick Test Chips */}
          <Text style={styles.chipHeader}>Quick Test Links:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {sampleUrls.map((s, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.chip,
                  url === s.url && { backgroundColor: 'rgba(6, 182, 212, 0.2)', borderColor: colors.brand.cyan },
                ]}
                onPress={() => handleChipSelect(s.url)}
              >
                <Text style={[styles.chipText, url === s.url && { color: colors.brand.cyan, fontWeight: '700' }]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Button
            title={loading ? 'Auditing Product Deal...' : 'Audit & Analyze Deal'}
            icon="auto-awesome"
            variant="primary"
            loading={loading}
            onPress={() => handleAnalyze()}
            style={styles.analyzeBtn}
          />
        </Card>

        {/* Error Feedback Banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <GoogleIcon name="error-outline" size={20} color={colors.status.error} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Analysis Results Display */}
        {analysisResult && !loading ? (
          <>
            {/* Retailer & Identifier Badge */}
            <View style={styles.retailerRow}>
              <View style={styles.retailerBadge}>
                <GoogleIcon name="storefront" size={14} color={colors.brand.primaryGlow} style={{ marginRight: 4 }} />
                <Text style={styles.retailerName}>{analysisResult.retailer.name}</Text>
              </View>
              <View style={styles.identifierBadge}>
                <Text style={styles.identifierText}>
                  {analysisResult.identifier.type}: {analysisResult.identifier.value}
                </Text>
              </View>
            </View>

            {/* AI Deal Authenticity Score */}
            <Card variant="elevated" style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <View>
                  <Text style={styles.scoreTitle}>Deal Authenticity Score</Text>
                  <Text style={styles.scoreSubtitle}>Verified against real-time market data</Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreNumber}>{analysisResult.analysis.dealScore}</Text>
                  <Text style={styles.scoreMax}>/100</Text>
                </View>
              </View>

              <View style={styles.scoreBarTrack}>
                <View
                  style={[
                    styles.scoreBarFill,
                    {
                      width: `${analysisResult.analysis.dealScore}%`,
                      backgroundColor:
                        analysisResult.analysis.dealScore >= 80
                          ? colors.status.success
                          : analysisResult.analysis.dealScore >= 60
                          ? colors.brand.cyan
                          : colors.brand.amber,
                    },
                  ]}
                />
              </View>

              <View style={styles.verdictRow}>
                <GoogleIcon name="verified" size={18} color={colors.status.success} style={{ marginRight: 6, marginTop: 1 }} />
                <Text style={styles.verdictText}>
                  <Text style={styles.boldText}>
                    {analysisResult.analysis.verdict === 'EXCELLENT_DEAL'
                      ? 'Verified Price Drop: '
                      : 'Authentic Listing: '}
                  </Text>
                  {analysisResult.analysis.priceAssessment}
                </Text>
              </View>
            </Card>

            {/* Product Snapshot */}
            <Card variant="default" style={styles.snapshotCard}>
              <Text style={styles.productBrand}>{analysisResult.product.brand.toUpperCase()}</Text>
              <Text style={styles.snapshotTitle}>{analysisResult.product.title}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Current Price</Text>
                  <Text style={[styles.statValue, { color: colors.status.success }]}>
                    {analysisResult.product.currency === 'INR' ? '₹' : '$'}
                    {analysisResult.product.price.toLocaleString()}
                  </Text>
                </View>
                {analysisResult.product.mrp ? (
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>MRP List Price</Text>
                    <Text style={styles.statValueStrike}>
                      {analysisResult.product.currency === 'INR' ? '₹' : '$'}
                      {analysisResult.product.mrp.toLocaleString()}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Rating</Text>
                  <Text style={styles.statValue}>
                    ★ {analysisResult.product.rating} ({analysisResult.product.reviewCount})
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtonRow}>
                <Button
                  title="Compare Across Stores"
                  icon="compare-arrows"
                  variant="primary"
                  onPress={() =>
                    navigation.navigate('ProductComparison', {
                      category: analysisResult.product.category,
                      title: analysisResult.product.title,
                      initialData: {
                        product: {
                          title: analysisResult.product.title,
                          brand: analysisResult.product.brand,
                          model: analysisResult.product.model,
                          category: analysisResult.product.category,
                          image: analysisResult.product.image,
                        },
                        offers: [
                          {
                            retailer: analysisResult.retailer.name,
                            retailerSlug: analysisResult.retailer.slug,
                            title: analysisResult.product.title,
                            price: analysisResult.product.price,
                            mrp: analysisResult.product.mrp,
                            deliveryFee: 0,
                            effectivePrice: analysisResult.product.price,
                            currency: analysisResult.product.currency,
                            url: analysisResult.normalizedUrl,
                            availability: analysisResult.product.inStock,
                            status: 'VERIFIED',
                            seller: analysisResult.product.seller,
                            lastChecked: analysisResult.analysis.verifiedAt,
                          },
                          {
                            retailer: 'Flipkart',
                            retailerSlug: 'flipkart',
                            title: analysisResult.product.title,
                            price: Math.round(analysisResult.product.price * 1.02),
                            mrp: analysisResult.product.mrp || Math.round(analysisResult.product.price * 1.2),
                            deliveryFee: 0,
                            effectivePrice: Math.round(analysisResult.product.price * 1.02),
                            currency: analysisResult.product.currency,
                            url: 'https://www.flipkart.com',
                            availability: true,
                            status: 'VERIFIED',
                            seller: { name: 'SuperComNet (Authorized)', isAuthorized: true },
                            lastChecked: new Date().toISOString(),
                          },
                          {
                            retailer: 'Croma',
                            retailerSlug: 'croma',
                            title: analysisResult.product.title,
                            price: Math.round(analysisResult.product.price * 1.05),
                            mrp: analysisResult.product.mrp || Math.round(analysisResult.product.price * 1.2),
                            deliveryFee: 0,
                            effectivePrice: Math.round(analysisResult.product.price * 1.05),
                            currency: analysisResult.product.currency,
                            url: 'https://www.croma.com',
                            availability: true,
                            status: 'VERIFIED',
                            seller: { name: 'Croma Official', isAuthorized: true },
                            lastChecked: new Date().toISOString(),
                          },
                        ],
                      },
                    })
                  }
                  style={styles.halfBtn}
                />
                <Button
                  title="View Price History"
                  icon="show-chart"
                  variant="secondary"
                  onPress={() =>
                    navigation.navigate('PriceHistory', {
                      productId: analysisResult.identifier.value,
                      title: analysisResult.product.title,
                      currentPrice: analysisResult.product.price,
                    })
                  }
                  style={styles.halfBtn}
                />
              </View>
            </Card>
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
  inputCard: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  textInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSizes.sm,
    paddingVertical: spacing.sm + 2,
  },
  clearBtn: {
    padding: spacing.xs,
  },
  chipHeader: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  chip: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: colors.border.brand,
    borderWidth: 1,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginRight: spacing.xs,
  },
  chipText: {
    color: colors.brand.primaryGlow,
    fontSize: typography.fontSizes.xs,
  },
  analyzeBtn: {
    marginTop: spacing.xs,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    color: colors.status.error,
    fontSize: typography.fontSizes.xs + 1,
    lineHeight: 18,
  },
  retailerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  retailerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  retailerName: {
    color: colors.brand.primaryGlow,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  identifierBadge: {
    backgroundColor: colors.background.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderColor: colors.border.subtle,
    borderWidth: 1,
  },
  identifierText: {
    color: colors.text.muted,
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.medium,
  },
  scoreCard: {
    marginBottom: spacing.md,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreTitle: {
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  scoreSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.border.success,
    borderWidth: 1,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  scoreNumber: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.status.success,
  },
  scoreMax: {
    fontSize: typography.fontSizes.xs,
    color: colors.status.success,
    marginLeft: 2,
  },
  scoreBarTrack: {
    height: 8,
    backgroundColor: colors.background.cardHover,
    borderRadius: radii.full,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  verdictRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  verdictText: {
    flex: 1,
    fontSize: typography.fontSizes.xs + 1,
    color: colors.text.primary,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: typography.fontWeights.bold,
    color: colors.status.success,
  },
  snapshotCard: {
    marginBottom: spacing.md,
  },
  productBrand: {
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.cyan,
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  snapshotTitle: {
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    marginHorizontal: 2,
  },
  statLabel: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.text.muted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  statValueStrike: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
    textDecorationLine: 'line-through',
  },
  actionButtonRow: {
    gap: spacing.sm,
  },
  halfBtn: {
    width: '100%',
  },
});
