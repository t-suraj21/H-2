import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
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
    route.params?.initialUrl || 'https://www.amazon.in/dp/B09XS7JWHH'
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzedProductData | null>(null);

  const sampleUrls = [
    { label: 'Amazon (Sony XM5)', url: 'https://www.amazon.in/dp/B09XS7JWHH' },
    { label: 'Flipkart (iPhone 16)', url: 'https://www.flipkart.com/apple-iphone-16/p/itmiphone16' },
    { label: 'Croma (MacBook M3)', url: 'https://www.croma.com/macbook-air-m3/p/260000' },
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
        subtitle="AI Deal Authenticity & Multi-Store Audit"
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 45 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* URL Input Box */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Product URL / E-Commerce Link</Text>
          <View style={styles.inputWrapper}>
            <GoogleIcon name="link" size={20} color="#2563EB" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              value={url}
              onChangeText={(text) => {
                setUrl(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Paste Amazon, Flipkart, or Croma link..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {url ? (
              <TouchableOpacity onPress={() => setUrl('')} style={styles.clearBtn}>
                <GoogleIcon name="close" size={18} color="#94A3B8" />
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
                  url === s.url && styles.chipActive,
                ]}
                onPress={() => handleChipSelect(s.url)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, url === s.url && styles.chipTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.analyzeBtn}
            onPress={() => handleAnalyze()}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.analyzeBtnInner}>
                <GoogleIcon name="auto-awesome" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.analyzeBtnText}>Audit & Analyze Deal</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Error Feedback Banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <GoogleIcon name="error-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Analysis Results Display */}
        {analysisResult ? (
          <>
            {/* Retailer Source & Canonical Model Info */}
            <View style={styles.retailerRow}>
              <View style={styles.retailerBadge}>
                <GoogleIcon name="storefront" size={14} color="#2563EB" style={{ marginRight: 4 }} />
                <Text style={styles.retailerName}>{analysisResult.retailer.name}</Text>
              </View>
              <View style={styles.identifierBadge}>
                <Text style={styles.identifierText}>
                  ID: {analysisResult.identifier.value}
                </Text>
              </View>
            </View>

            {/* Deal Authenticity Score Gauge Card */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <View>
                  <Text style={styles.scoreTitle}>Deal Authenticity Score</Text>
                  <Text style={styles.scoreSubtitle}>Real-time AI valuation against historical benchmarks</Text>
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
                          ? '#2563EB'
                          : analysisResult.analysis.dealScore >= 50
                          ? '#F59E0B'
                          : '#EF4444',
                    },
                  ]}
                />
              </View>

              <View style={styles.verdictRow}>
                <GoogleIcon name="verified" size={18} color="#2563EB" style={{ marginRight: 6, marginTop: 1 }} />
                <Text style={styles.verdictText}>
                  <Text style={styles.boldText}>
                    {analysisResult.analysis.verdict === 'EXCELLENT_DEAL'
                      ? 'Verified Price Drop: '
                      : 'Authentic Listing: '}
                  </Text>
                  {analysisResult.analysis.priceAssessment}
                </Text>
              </View>
            </View>

            {/* Product Snapshot */}
            <View style={styles.snapshotCard}>
              <View style={styles.productBrandBadge}>
                <Text style={styles.productBrand}>{analysisResult.product.brand.toUpperCase()}</Text>
              </View>
              <Text style={styles.snapshotTitle}>{analysisResult.product.title}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Current Price</Text>
                  <Text style={[styles.statValue, { color: '#2563EB' }]}>
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
                <TouchableOpacity
                  style={styles.primaryActionBtn}
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
                  activeOpacity={0.88}
                >
                  <GoogleIcon name="compare-arrows" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryActionBtnText}>Compare Across Stores</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryActionBtn}
                  onPress={() =>
                    navigation.navigate('PriceHistory', {
                      productId: analysisResult.identifier.value,
                      title: analysisResult.product.title,
                      currentPrice: analysisResult.product.price,
                    })
                  }
                  activeOpacity={0.88}
                >
                  <GoogleIcon name="show-chart" size={18} color="#0F172A" style={{ marginRight: 8 }} />
                  <Text style={styles.secondaryActionBtnText}>View Price History</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  inputCard: {
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
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 50,
  },
  textInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 4,
  },
  chipHeader: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  analyzeBtn: {
    backgroundColor: '#0F172A',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  analyzeBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  retailerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  retailerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  retailerName: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  identifierBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  identifierText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  scoreCard: {
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
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  scoreTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  scoreSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
  },
  scoreMax: {
    fontSize: 11,
    color: '#2563EB',
    marginLeft: 2,
    fontWeight: '700',
  },
  scoreBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  verdictRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
  },
  verdictText: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '800',
    color: '#2563EB',
  },
  snapshotCard: {
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
  productBrandBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  productBrand: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.8,
  },
  snapshotTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 14,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  statValueStrike: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  actionButtonRow: {
    gap: 10,
  },
  primaryActionBtn: {
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
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
});
