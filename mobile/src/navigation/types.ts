import type { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

/**
 * Authentication Stack Parameter List
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/**
 * Main Bottom Tab Parameter List
 */
export type MainTabParamList = {
  Home: undefined;
  Watchlist: undefined;
  Alerts: undefined;
  Profile: undefined;
};

/**
 * Root Stack Parameter List
 */
export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Products: undefined;
  ProductComparison: { productUrl?: string; initialData?: any; productId?: string; category?: string; title?: string } | undefined;
  ProductDetails: { productId: string; title?: string; price?: number };
  PriceHistory: { productId: string; title?: string; currentPrice?: number };
  ShoppingWebView: { platformName: string; url: string; color: string; platformId?: string };
};

/**
 * Screen Props Typed Helpers
 */
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
