import { Linking, Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export interface StorePlatformConfig {
  id: string;
  name: string;
  color: string;
  homeUrl: string;
  ordersUrl: string;
  searchUrlTemplate: (q: string) => string;
  appSchemes: {
    home: string[];
    orders: string[];
    search: (q: string) => string[];
  };
  androidPackage?: string;
  iosAppStoreId?: string;
}

export const STORE_CONFIGS: Record<string, StorePlatformConfig> = {
  amazon: {
    id: 'amazon',
    name: 'Amazon India',
    color: '#FF9900',
    homeUrl: 'https://www.amazon.in',
    ordersUrl: 'https://www.amazon.in/gp/css/order-history',
    searchUrlTemplate: (q: string) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
    appSchemes: {
      home: ['amazon://', 'com.amazon.mobile.shopping://', 'https://www.amazon.in'],
      orders: ['amazon://order-history', 'com.amazon.mobile.shopping://order-history', 'https://www.amazon.in/gp/css/order-history'],
      search: (q: string) => [
        `amazon://search?k=${encodeURIComponent(q)}`,
        `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
      ],
    },
    androidPackage: 'com.amazon.mShop.android.shopping',
  },
  flipkart: {
    id: 'flipkart',
    name: 'Flipkart',
    color: '#2874F0',
    homeUrl: 'https://www.flipkart.com',
    ordersUrl: 'https://www.flipkart.com/account/orders',
    searchUrlTemplate: (q: string) => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`,
    appSchemes: {
      home: ['flipkart://', 'https://www.flipkart.com'],
      orders: ['flipkart://orders', 'https://www.flipkart.com/account/orders'],
      search: (q: string) => [
        `flipkart://search?q=${encodeURIComponent(q)}`,
        `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`,
      ],
    },
    androidPackage: 'com.flipkart.android',
  },
  myntra: {
    id: 'myntra',
    name: 'Myntra',
    color: '#FF3F6C',
    homeUrl: 'https://www.myntra.com',
    ordersUrl: 'https://www.myntra.com/my/orders',
    searchUrlTemplate: (q: string) =>
      `https://www.myntra.com/${encodeURIComponent(q.toLowerCase().replace(/\s+/g, '-'))}`,
    appSchemes: {
      home: ['myntra://', 'https://www.myntra.com'],
      orders: ['myntra://orders', 'myntra://my/orders', 'https://www.myntra.com/my/orders'],
      search: (q: string) => [
        `myntra://search/${encodeURIComponent(q)}`,
        `https://www.myntra.com/${encodeURIComponent(q.toLowerCase().replace(/\s+/g, '-'))}`,
      ],
    },
    androidPackage: 'com.myntra.android',
  },
  meesho: {
    id: 'meesho',
    name: 'Meesho',
    color: '#9B27B0',
    homeUrl: 'https://www.meesho.com',
    ordersUrl: 'https://www.meesho.com/orders',
    searchUrlTemplate: (q: string) => `https://www.meesho.com/search?q=${encodeURIComponent(q)}`,
    appSchemes: {
      home: ['meesho://', 'https://www.meesho.com'],
      orders: ['meesho://orders', 'https://www.meesho.com/orders'],
      search: (q: string) => [
        `meesho://search?q=${encodeURIComponent(q)}`,
        `https://www.meesho.com/search?q=${encodeURIComponent(q)}`,
      ],
    },
    androidPackage: 'com.meesho.supply',
  },
  croma: {
    id: 'croma',
    name: 'Croma',
    color: '#00A389',
    homeUrl: 'https://www.croma.com',
    ordersUrl: 'https://www.croma.com/my-account/orders',
    searchUrlTemplate: (q: string) =>
      `https://www.croma.com/searchB?q=${encodeURIComponent(q)}%3Arelevance`,
    appSchemes: {
      home: ['https://www.croma.com'],
      orders: ['https://www.croma.com/my-account/orders'],
      search: (q: string) => [`https://www.croma.com/searchB?q=${encodeURIComponent(q)}%3Arelevance`],
    },
  },
};

export interface LaunchOptions {
  platformId: string;
  mode?: 'auto' | 'app' | 'webview' | 'browser';
  isOrders?: boolean;
  searchQuery?: string;
  customUrl?: string;
  navigation?: any;
}

/**
 * Universal Store & Order Launcher
 * Supports direct native app opening, in-app WebView, and Chrome Custom Tabs/Safari.
 */
export async function openStoreApp(options: LaunchOptions): Promise<void> {
  const {
    platformId,
    mode = 'auto',
    isOrders = false,
    searchQuery,
    customUrl,
    navigation,
  } = options;

  const config = STORE_CONFIGS[platformId.toLowerCase()] || STORE_CONFIGS.amazon;

  // Determine target web URL
  let webUrl = customUrl || (isOrders ? config.ordersUrl : config.homeUrl);
  if (searchQuery) {
    webUrl = config.searchUrlTemplate(searchQuery);
  }

  // On Web (browser): Open in a new tab immediately (avoids X-Frame-Options blocks)
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.open) {
      window.open(webUrl, '_blank');
      return;
    }
    await Linking.openURL(webUrl);
    return;
  }

  // On Native App Mode: Try deep link schemes for the installed native shopping app
  if (mode === 'app' || mode === 'auto') {
    let candidateSchemes: string[] = [];
    if (searchQuery) {
      candidateSchemes = config.appSchemes.search(searchQuery);
    } else if (isOrders) {
      candidateSchemes = config.appSchemes.orders;
    } else {
      candidateSchemes = config.appSchemes.home;
    }

    // Try custom URL schemes first
    for (const scheme of candidateSchemes) {
      if (!scheme.startsWith('http')) {
        try {
          const supported = await Linking.canOpenURL(scheme);
          if (supported) {
            await Linking.openURL(scheme);
            return;
          }
        } catch {
          // Continue to next scheme
        }
      }
    }
  }

  // If external browser requested:
  if (mode === 'browser') {
    try {
      await WebBrowser.openBrowserAsync(webUrl, {
        toolbarColor: config.color,
        showTitle: true,
        enableBarCollapsing: true,
      });
      return;
    } catch {
      await Linking.openURL(webUrl);
      return;
    }
  }

  // In-App WebView (with auto-fill injection for credentials and delivery addresses):
  if (navigation && navigation.navigate) {
    navigation.navigate('ShoppingWebView', {
      platformName: isOrders ? `${config.name} Orders` : config.name,
      url: webUrl,
      color: config.color,
    });
    return;
  }

  // Fallback to Linking
  await Linking.openURL(webUrl);
}

/**
 * Open external link or app scheme safely
 */
export async function openExternalUrl(url: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.open) {
        window.open(url, '_blank');
        return true;
      }
    }
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    }
    await Linking.openURL(url);
    return true;
  } catch (err) {
    return false;
  }
}
