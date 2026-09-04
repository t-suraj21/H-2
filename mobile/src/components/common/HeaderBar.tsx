import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, radii } from '../../theme';
import { GoogleIcon, GoogleIconName } from './GoogleIcon';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: {
    icon: GoogleIconName;
    onPress: () => void;
    label?: string;
  };
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  showBack = true,
  rightAction,
}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack && navigation.canGoBack() ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.75}
          >
            <GoogleIcon name="arrow-back-ios" size={16} color="#0F172A" style={styles.backIcon} />
          </TouchableOpacity>
        ) : (
          <View style={styles.brandDot}>
            <View style={styles.brandDotInner} />
          </View>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightAction ? (
        <TouchableOpacity
          onPress={rightAction.onPress}
          style={styles.rightButton}
          activeOpacity={0.75}
        >
          <GoogleIcon name={rightAction.icon} size={18} color="#0F172A" style={styles.rightIcon} />
          {rightAction.label ? (
            <Text style={styles.rightLabel}>{rightAction.label}</Text>
          ) : null}
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderColor: '#DBEAFE',
    borderWidth: 1,
  },
  backIcon: {
    marginLeft: 5,
  },
  brandDot: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderColor: '#DBEAFE',
    borderWidth: 1,
  },
  rightIcon: {
    marginRight: 4,
  },
  rightLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
});
