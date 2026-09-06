import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { AnalyzeProductScreen } from '../screens/AnalyzeProductScreen';
import { ProductComparisonScreen } from '../screens/ProductComparisonScreen';
import { ProductDetailsScreen } from '../screens/ProductDetailsScreen';
import { PriceHistoryScreen } from '../screens/PriceHistoryScreen';
import { ShoppingWebViewScreen } from '../screens/ShoppingWebViewScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      {/* Splash Screen */}
      <Stack.Screen name="Splash" component={SplashScreen} />

      {/* Authentication Stack */}
      <Stack.Screen name="Auth" component={AuthNavigator} />

      {/* Main Application Tabs */}
      <Stack.Screen name="Main" component={MainTabNavigator} />

      {/* Deep Feature & Detail Screens */}
      <Stack.Screen
        name="AnalyzeProduct"
        component={AnalyzeProductScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="ProductComparison"
        component={ProductComparisonScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="PriceHistory"
        component={PriceHistoryScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="ShoppingWebView"
        component={ShoppingWebViewScreen}
        options={{ presentation: 'card', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
};
