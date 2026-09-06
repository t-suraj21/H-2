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
} from 'react-native';
import WebViewComponent, { WebViewNavigation } from 'react-native-webview';

// Cast to bypass react-native-webview v14 TypeScript JSX incompatibility
const WebView = WebViewComponent as any;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { useAuth } from '../context/AuthContext';
import { RootStackScreenProps } from '../navigation/types';

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
  const { platformName, url, color } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const webViewRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [pageTitle, setPageTitle] = useState(platformName);

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
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => webViewRef.current?.reload()}
            activeOpacity={0.7}
          >
            <GoogleIcon name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <GoogleIcon name="share" size={20} color="#FFFFFF" />
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
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onLoadProgress={({ nativeEvent }: { nativeEvent: { progress: number } }) => setLoadProgress(nativeEvent.progress)}
        onNavigationStateChange={handleNavigationStateChange}
        injectedJavaScript={autoFillScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsBackForwardNavigationGestures={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={color} />
            <Text style={styles.loadingText}>Loading {platformName}...</Text>
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

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => {
            webViewRef.current?.injectJavaScript(
              `window.location.href = '${url}'; true;`
            );
          }}
          activeOpacity={0.7}
        >
          <GoogleIcon name="home" size={20} color="#0F172A" />
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
    width: 38,
    height: 38,
    borderRadius: 19,
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingHorizontal: 12,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnCenter: {
    flex: 1,
    maxWidth: 140,
    marginHorizontal: 8,
  },
  autoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    gap: 6,
  },
  autoFillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
