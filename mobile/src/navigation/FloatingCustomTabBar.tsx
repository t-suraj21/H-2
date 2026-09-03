import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, radii, spacing } from '../theme';
import { GoogleIcon, GoogleIconName } from '../components/common/GoogleIcon';

interface TabConfig {
  name: string;
  label: string;
  icon: GoogleIconName;
  activeIcon: GoogleIconName;
}

export const FloatingCustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  const tabs: TabConfig[] = [
    {
      name: 'Home',
      label: 'Home',
      icon: 'home',
      activeIcon: 'home',
    },
    {
      name: 'Watchlist',
      label: 'Watchlist',
      icon: 'bookmark-border',
      activeIcon: 'bookmark',
    },
    {
      name: 'Alerts',
      label: 'Alerts',
      icon: 'notifications-none',
      activeIcon: 'notifications-active',
    },
    {
      name: 'Profile',
      label: 'Profile',
      icon: 'person-outline',
      activeIcon: 'person',
    },
  ];

  // Helper to open the Center Action (Analyze Product / AI Deal Scanner)
  const onCenterPress = () => {
    navigation.navigate('AnalyzeProduct', {});
  };

  const renderTabItem = (tab: TabConfig, index: number) => {
    const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
    const isFocused = state.index === routeIndex;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: state.routes[routeIndex]?.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(tab.name);
      }
    };

    return (
      <TouchableOpacity
        key={tab.name}
        onPress={onPress}
        activeOpacity={0.75}
        style={styles.tabButton}
      >
        <View style={[styles.iconWrapper, isFocused && styles.activeIconWrapper]}>
          <GoogleIcon
            name={isFocused ? tab.activeIcon : tab.icon}
            size={22}
            color={isFocused ? colors.brand.cyan : '#94A3B8'}
          />
        </View>
        <Text style={[styles.tabLabel, isFocused && styles.activeTabLabel]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          bottom: insets.bottom > 0 ? insets.bottom + 8 : 16,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.pillContainer}>
        {/* Left 2 Tabs: Home & Watchlist */}
        {renderTabItem(tabs[0], 0)}
        {renderTabItem(tabs[1], 1)}

        {/* Center Gap for Elevated Floating Action Hub */}
        <View style={styles.centerGap} />

        {/* Right 2 Tabs: Price Alerts & Profile */}
        {renderTabItem(tabs[2], 2)}
        {renderTabItem(tabs[3], 3)}
      </View>

      {/* Prominent Center Elevated AI Scanner Hub */}
      <View style={styles.centerButtonWrapper} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.centerOuterRing}
          activeOpacity={0.85}
          onPress={onCenterPress}
        >
          <View style={styles.centerInnerCircle}>
            <GoogleIcon name="qr-code-scanner" size={26} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 18,
    right: 18,
    alignItems: 'center',
    zIndex: 999,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 68,
    backgroundColor: '#1E293B',
    borderRadius: 34,
    paddingHorizontal: 10,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    borderWidth: 1.5,
    // Soft floating shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrapper: {
    padding: 3,
    borderRadius: radii.sm,
  },
  activeIconWrapper: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  activeTabLabel: {
    color: colors.brand.cyan,
    fontWeight: '700',
  },
  centerGap: {
    width: 66,
  },
  centerButtonWrapper: {
    position: 'absolute',
    top: -18,
    alignSelf: 'center',
    zIndex: 1000,
  },
  centerOuterRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    // Neon Bezel Ring
    borderWidth: 3,
    borderColor: colors.brand.primary,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 16,
  },
  centerInnerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
