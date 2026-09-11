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
    navigation.navigate('Products');
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
            color={isFocused ? colors.brand.primaryGlow : '#6B7280'}
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
          activeOpacity={0.88}
          onPress={onCenterPress}
        >
          <View style={styles.centerInnerCircle}>
            <GoogleIcon name="shopping-bag" size={26} color="#FFFFFF" />
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
    height: 66,
    backgroundColor: '#FFFFFF',
    borderRadius: 33,
    paddingHorizontal: 10,
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    // Soft floating shadow
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  activeIconWrapper: {
    backgroundColor: '#EFF6FF',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  activeTabLabel: {
    color: '#2563EB',
    fontWeight: '700',
  },
  centerGap: {
    width: 62,
  },
  centerButtonWrapper: {
    position: 'absolute',
    top: -16,
    alignSelf: 'center',
    zIndex: 1000,
  },
  centerOuterRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  centerInnerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
