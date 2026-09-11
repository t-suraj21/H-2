import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Share,
  StatusBar,
  Linking,
} from 'react-native';
import WebViewComponent, { WebViewNavigation } from 'react-native-webview';

// Cast to bypass react-native-webview v14 TypeScript JSX incompatibility
const WebView = WebViewComponent as any;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { useAuth } from '../context/AuthContext';
import { RootStackScreenProps } from '../navigation/types';
import { STORE_CONFIGS, openStoreApp, openExternalUrl } from '../utils/platformLauncher';

/**
 * Auto-fill injection script for shopping platform login/register forms.
 * Detects known form fields on Amazon, Flipkart, Meesho, Myntra and pre-fills
 * user credentials from their HL² profile.
 */
const buildAutoFillScript = (user: {
  name?: string;
  email?: string;
  phone?: string;
  fullName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}) => {
  const name = (user.fullName || user.name || '').replace(/'/g, "\\'");
  const email = (user.email || '').replace(/'/g, "\\'");
  const phone = (user.phone || '').replace(/'/g, "\\'");
  const address1 = (user.addressLine1 || '').replace(/'/g, "\\'");
  const address2 = (user.addressLine2 || '').replace(/'/g, "\\'");
  const city = (user.city || '').replace(/'/g, "\\'");
  const state = (user.state || '').replace(/'/g, "\\'");
  const pincode = (user.pincode || '').replace(/'/g, "\\'");

  return `
    (function() {
      'use strict';
      
      function fillInput(el, value) {
        if (!el || !value) return false;
        var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        );
        if (nativeInputValueSetter && nativeInputValueSetter.set) {
          nativeInputValueSetter.set.call(el, value);
        } else {
          el.value = value;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
        return true;
      }

      function tryAutoFill() {
        var filled = 0;
        
        // Email selectors
        var emailSelectors = [
          'input[type="email"]',
          'input[name="email"]',
          'input[id="ap_email"]',           // Amazon
          'input[name="loginId"]',          // Flipkart  
          'input[placeholder*="email" i]',
          'input[placeholder*="Email" i]',
          'input[autocomplete="email"]',
        ];
        
        // Phone selectors
        var phoneSelectors = [
          'input[type="tel"]',
          'input[name="phone"]',
          'input[name="mobileNumber"]',
          'input[id="ap_phone_number"]',    // Amazon
          'input[placeholder*="phone" i]',
          'input[placeholder*="mobile" i]',
          'input[placeholder*="Phone" i]',
          'input[placeholder*="Mobile" i]',
          'input[autocomplete="tel"]',
        ];
        
        // Name selectors
        var nameSelectors = [
          'input[name="name"]',
          'input[name="customerName"]',
          'input[id="ap_customer_name"]',   // Amazon
          'input[name="address-ui-widgets-enterAddressFullName"]', // Amazon address
          'input[name="deliveryName"]',
          'input[placeholder*="full name" i]',
          'input[placeholder*="Full Name" i]',
          'input[placeholder*="name" i]',
          'input[placeholder*="Name" i]',
          'input[autocomplete="name"]',
        ];

        // Pincode / Zip selectors
        var pinSelectors = [
          'input[name="pincode"]',
          'input[name="zipCode"]',
          'input[name="postalCode"]',
          'input[name="address-ui-widgets-enterAddressPostalCode"]', // Amazon
          'input[placeholder*="pincode" i]',
          'input[placeholder*="pin code" i]',
          'input[placeholder*="postal" i]',
          'input[placeholder*="zip" i]',
          'input[autocomplete="postal-code"]',
        ];

        // Address Line 1 selectors (Flat, House, Building, Street)
        var addr1Selectors = [
          'input[name="addressLine1"]',
          'input[name="address1"]',
          'input[name="address-ui-widgets-enterAddressLine1"]', // Amazon
          'input[name="street"]',
          'textarea[name="address"]',
          'input[placeholder*="flat" i]',
          'input[placeholder*="house" i]',
          'input[placeholder*="building" i]',
          'input[placeholder*="street" i]',
          'input[autocomplete="address-line1"]',
        ];

        // Address Line 2 selectors (Area, Colony, Landmark)
        var addr2Selectors = [
          'input[name="addressLine2"]',
          'input[name="address2"]',
          'input[name="address-ui-widgets-enterAddressLine2"]', // Amazon
          'input[name="landmark"]',
          'input[placeholder*="area" i]',
          'input[placeholder*="colony" i]',
          'input[placeholder*="landmark" i]',
          'input[autocomplete="address-line2"]',
        ];

        // City selectors
        var citySelectors = [
          'input[name="city"]',
          'input[name="address-ui-widgets-enterAddressCity"]', // Amazon
          'input[placeholder*="city" i]',
          'input[placeholder*="town" i]',
          'input[placeholder*="district" i]',
          'input[autocomplete="address-level2"]',
        ];

        // State selectors
        var stateSelectors = [
          'input[name="state"]',
          'input[name="address-ui-widgets-enterAddressStateOrRegion"]', // Amazon
          'input[placeholder*="state" i]',
          'input[autocomplete="address-level1"]',
        ];

        function fillList(selectors, value) {
          if (!value) return;
          selectors.forEach(function(sel) {
            var els = document.querySelectorAll(sel);
            els.forEach(function(el) {
              if (!el.value) {
                if (fillInput(el, value)) filled++;
              }
            });
          });
        }

        fillList(emailSelectors, '${email}');
        
        var cleanPhone = '${phone}'.replace(/^\\+91[\\-\\s]?/, '');
        fillList(phoneSelectors, cleanPhone);
        
        fillList(nameSelectors, '${name}');
        fillList(pinSelectors, '${pincode}');
        fillList(addr1Selectors, '${address1}');
        fillList(addr2Selectors, '${address2}');
        fillList(citySelectors, '${city}');
        fillList(stateSelectors, '${state}');

        return filled;
      }

      // Run immediately
      tryAutoFill();

      // Re-run after short delays (for dynamically loaded forms)
      setTimeout(tryAutoFill, 1000);
      setTimeout(tryAutoFill, 2500);
      setTimeout(tryAutoFill, 5000);

      // Also observe for new form elements being added
      var observer = new MutationObserver(function(mutations) {
        var hasNewInputs = mutations.some(function(m) {
          return Array.from(m.addedNodes).some(function(n) {
            return n.querySelectorAll && n.querySelectorAll('input, textarea').length > 0;
          });
        });
        if (hasNewInputs) {
          setTimeout(tryAutoFill, 300);
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(function() { observer.disconnect(); }, 40000);
    })();
    true;
  `;
};

export const ShoppingWebViewScreen: React.FC<RootStackScreenProps<'ShoppingWebView'>> = ({
  navigation,
  route,
}) => {
  const { platformName, url, color, platformId } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const webViewRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [pageTitle, setPageTitle] = useState(platformName);
  const [hasLoadError, setHasLoadError] = useState(false);

  // Identify platform config key
  const normalizedKey = (platformId || platformName || '').toLowerCase();
  const platformKey = normalizedKey.includes('amazon')
    ? 'amazon'
    : normalizedKey.includes('flipkart')
    ? 'flipkart'
    : normalizedKey.includes('myntra')
    ? 'myntra'
    : normalizedKey.includes('meesho')
    ? 'meesho'
    : normalizedKey.includes('croma')
    ? 'croma'
    : 'amazon';

  const storeConfig = STORE_CONFIGS[platformKey] || STORE_CONFIGS.amazon;

  const autoFillScript = buildAutoFillScript({
    name: user?.name,
    email: user?.email,
    phone: user?.phone || undefined,
    fullName: user?.shippingAddress?.fullName || user?.name,
    addressLine1: user?.shippingAddress?.addressLine1,
    addressLine2: user?.shippingAddress?.addressLine2,
    city: user?.shippingAddress?.city,
    state: user?.shippingAddress?.state,
    pincode: user?.shippingAddress?.pincode,
  });

  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    if (navState.url) setCurrentUrl(navState.url);
    if (navState.title && navState.title !== 'about:blank') {
      setPageTitle(navState.title.length > 30 ? navState.title.substring(0, 30) + '...' : navState.title);
    }
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check this out on ${platformName}: ${currentUrl}`,
        url: currentUrl,
      });
    } catch {}
  };

  const handleOpenInOfficialApp = async () => {
    await openStoreApp({
      platformId: platformKey,
      mode: 'app',
      customUrl: currentUrl || url,
      navigation,
    });
  };

  const handleOpenOrdersInApp = async () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.open) {
        window.open(storeConfig.ordersUrl, '_blank');
        return;
      }
    }
    await openStoreApp({
      platformId: platformKey,
      isOrders: true,
      navigation,
    });
  };

  const handleOpenExternalBrowser = async () => {
    await openExternalUrl(currentUrl || url);
  };

  // Intercept redirects to native app schemes, android intents, and UPI payments
  const handleShouldStartLoadWithRequest = (request: { url: string }) => {
    const reqUrl = request.url;
    if (
      reqUrl.startsWith('http://') ||
      reqUrl.startsWith('https://') ||
      reqUrl.startsWith('about:blank') ||
      reqUrl.startsWith('data:')
    ) {
      return true;
    }

    if (reqUrl.startsWith('intent://')) {
      const fallbackMatch = reqUrl.match(/browser_fallback_url=([^;&]+)/);
      const decodedFallback = fallbackMatch && fallbackMatch[1] ? decodeURIComponent(fallbackMatch[1]) : null;

      Linking.canOpenURL(reqUrl).then((canOpen) => {
        if (canOpen) {
          Linking.openURL(reqUrl).catch(() => {
            if (decodedFallback) Linking.openURL(decodedFallback).catch(() => {});
          });
        } else if (decodedFallback) {
          Linking.openURL(decodedFallback).catch(() => {});
        }
      }).catch(() => {
        if (decodedFallback) Linking.openURL(decodedFallback).catch(() => {});
      });
      return false;
    }

    // App schemes (amazon://, flipkart://, myntra://, meesho://, upi://, paytmmp://)
    Linking.canOpenURL(reqUrl).then((supported) => {
      if (supported) {
        Linking.openURL(reqUrl).catch(() => {});
      }
    }).catch(() => {});
    return false;
  };

  // Dedicated Web Platform Rendering (bypasses browser X-Frame-Options blocking)
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />

        <View style={[styles.header, { backgroundColor: color }]}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <GoogleIcon name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {platformName}
            </Text>
            <Text style={styles.headerUrl} numberOfLines={1}>
              Official Store Portal
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <GoogleIcon name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.webFallbackContainer}>
          <View style={[styles.webFallbackCard, { borderColor: color + '40' }]}>
            <View style={[styles.webIconCircle, { backgroundColor: color + '15' }]}>
              <GoogleIcon name="shopping-bag" size={44} color={color} />
            </View>

            <Text style={styles.webFallbackTitle}>Launch {platformName}</Text>
            <Text style={styles.webFallbackDesc}>
              To protect customer accounts, {platformName} requires opening in a dedicated browser window or mobile application.
            </Text>

            <TouchableOpacity
              style={[styles.webPrimaryBtn, { backgroundColor: color }]}
              onPress={() => {
                if (typeof window !== 'undefined' && window.open) {
                  window.open(url, '_blank');
                } else {
                  Linking.openURL(url);
                }
              }}
              activeOpacity={0.85}
            >
              <GoogleIcon name="open-in-new" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.webPrimaryBtnText}>Open {platformName} Store</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.webSecondaryBtn}
              onPress={handleOpenOrdersInApp}
              activeOpacity={0.85}
            >
              <GoogleIcon name="local-shipping" size={18} color="#0F172A" style={{ marginRight: 8 }} />
              <Text style={styles.webSecondaryBtnText}>Track My Orders</Text>
            </TouchableOpacity>

            <View style={styles.webSecurityNote}>
              <GoogleIcon name="security" size={16} color="#059669" style={{ marginRight: 6 }} />
              <Text style={styles.webSecurityNoteText}>
                HL² Unified Profile & Delivery Address are synced and ready.
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Navigation Header */}
      <View style={[styles.header, { backgroundColor: color }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <GoogleIcon name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {pageTitle}
          </Text>
          <Text style={styles.headerUrl} numberOfLines={1}>
            {currentUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {/* Direct Open in Official Native Store App */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleOpenInOfficialApp}
            activeOpacity={0.7}
          >
            <GoogleIcon name="open-in-new" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Quick Track Orders Button */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleOpenOrdersInApp}
            activeOpacity={0.7}
          >
            <GoogleIcon name="local-shipping" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              setHasLoadError(false);
              webViewRef.current?.reload();
            }}
            activeOpacity={0.7}
          >
            <GoogleIcon name="refresh" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <GoogleIcon name="share" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      {isLoading && (
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${loadProgress * 100}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webView}
        originWhitelist={['*']}
        onLoadStart={() => {
          setIsLoading(true);
          setHasLoadError(false);
        }}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => setHasLoadError(true)}
        onLoadProgress={({ nativeEvent }: { nativeEvent: { progress: number } }) => setLoadProgress(nativeEvent.progress)}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        injectedJavaScript={autoFillScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsBackForwardNavigationGestures={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        javaScriptCanOpenWindowsAutomatically={true}
        setSupportMultipleWindows={false}
        userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={color} />
            <Text style={styles.loadingText}>Loading {platformName}...</Text>
            <Text style={styles.loadingSubText}>Applying HL² Auto-Fill Identity</Text>
          </View>
        )}
        renderError={() => (
          <View style={styles.errorOverlay}>
            <GoogleIcon name="wifi-off" size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Unable to display page</Text>
            <Text style={styles.errorSub}>
              {platformName} can be launched directly in the official app or your device browser.
            </Text>
            <View style={styles.errorActionsRow}>
              <TouchableOpacity
                style={[styles.errorBtnPrimary, { backgroundColor: color }]}
                onPress={handleOpenInOfficialApp}
                activeOpacity={0.85}
              >
                <GoogleIcon name="open-in-new" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.errorBtnPrimaryText}>Open in App</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.errorBtnSecondary}
                onPress={handleOpenExternalBrowser}
                activeOpacity={0.85}
              >
                <GoogleIcon name="language" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.errorBtnSecondaryText}>Open in Browser</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
        <TouchableOpacity
          style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
          onPress={() => webViewRef.current?.goBack()}
          disabled={!canGoBack}
          activeOpacity={0.7}
        >
          <GoogleIcon name="arrow-back-ios" size={18} color={canGoBack ? '#0F172A' : '#CBD5E1'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
          onPress={() => webViewRef.current?.goForward()}
          disabled={!canGoForward}
          activeOpacity={0.7}
        >
          <GoogleIcon name="arrow-forward-ios" size={18} color={canGoForward ? '#0F172A' : '#CBD5E1'} />
        </TouchableOpacity>

        {/* Center Auto-Fill Action */}
        <TouchableOpacity
          style={styles.navBtnCenter}
          onPress={() => {
            webViewRef.current?.injectJavaScript(autoFillScript);
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.autoFillBtn, { backgroundColor: color }]}>
            <GoogleIcon name="auto-fix-high" size={18} color="#FFFFFF" />
            <Text style={styles.autoFillText}>Auto-Fill</Text>
          </View>
        </TouchableOpacity>

        {/* Track Orders Quick Action */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={handleOpenOrdersInApp}
          activeOpacity={0.7}
        >
          <GoogleIcon name="local-shipping" size={20} color="#0F172A" />
        </TouchableOpacity>

        {/* Launch in Official App */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={handleOpenInOfficialApp}
          activeOpacity={0.7}
        >
          <GoogleIcon name="open-in-new" size={20} color="#0F172A" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <GoogleIcon name="close" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 4,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 6,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerUrl: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: '#E2E8F0',
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
  },
  loadingSubText: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  errorSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  errorActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  errorBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  errorBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  errorBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  errorBtnSecondaryText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  webFallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  webFallbackCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  webIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  webFallbackTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  webFallbackDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  webPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
    borderRadius: 16,
    marginBottom: 10,
  },
  webPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  webSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 46,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  webSecondaryBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  webSecurityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  webSecurityNoteText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  navBtnCenter: {
    flex: 1,
    maxWidth: 125,
    marginHorizontal: 4,
  },
  autoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 12,
    gap: 5,
  },
  autoFillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
