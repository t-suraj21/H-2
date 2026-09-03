import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GoogleIcon } from '../common/GoogleIcon';

export const AuthIllustration: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Background soft ambient halo */}
      <View style={styles.haloRing} />
      <View style={styles.haloInner} />

      {/* Main Illustration Wrapper */}
      <View style={styles.characterContainer}>
        {/* Floating Analytics Badges */}
        <View style={[styles.floatingBadge, styles.badgeLeft]}>
          <GoogleIcon name="trending-down" size={16} color="#122E15" />
        </View>

        <View style={[styles.floatingBadge, styles.badgeRight]}>
          <GoogleIcon name="verified" size={16} color="#84E152" />
        </View>

        {/* Head with Headphones */}
        <View style={styles.headWrapper}>
          <View style={styles.headphoneBand} />
          <View style={[styles.headphoneEar, styles.earLeft]} />
          <View style={[styles.headphoneEar, styles.earRight]} />
          <View style={styles.face}>
            <View style={styles.hair} />
            <View style={styles.glasses}>
              <View style={styles.glassLens} />
              <View style={styles.glassBridge} />
              <View style={styles.glassLens} />
            </View>
            <View style={styles.smile} />
          </View>
        </View>

        {/* Body & Arms */}
        <View style={styles.bodyWrapper}>
          <View style={styles.shirt} />
          <View style={[styles.arm, styles.armLeft]} />
          <View style={[styles.arm, styles.armRight]} />
        </View>

        {/* Laptop */}
        <View style={styles.laptopScreen}>
          <View style={styles.screenContent}>
            <View style={styles.chartLine} />
            <View style={styles.laptopLogo}>
              <View style={styles.appleDot} />
            </View>
          </View>
        </View>
        <View style={styles.laptopBase} />

        {/* Desk shadow */}
        <View style={styles.deskShadow} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 240,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  haloRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#F3FAF0',
  },
  haloInner: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#E8F7E4',
  },
  characterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingBadge: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E8EFE5',
    zIndex: 10,
  },
  badgeLeft: {
    top: 20,
    left: -20,
  },
  badgeRight: {
    top: 40,
    right: -20,
  },
  headWrapper: {
    alignItems: 'center',
    position: 'relative',
    zIndex: 5,
  },
  headphoneBand: {
    position: 'absolute',
    top: -6,
    width: 66,
    height: 44,
    borderTopLeftRadius: 33,
    borderTopRightRadius: 33,
    borderWidth: 3,
    borderColor: '#111827',
    borderBottomWidth: 0,
    zIndex: 2,
  },
  headphoneEar: {
    position: 'absolute',
    width: 12,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#111827',
    top: 14,
    zIndex: 6,
  },
  earLeft: {
    left: -7,
  },
  earRight: {
    right: -7,
  },
  face: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#111827',
    alignItems: 'center',
    position: 'relative',
  },
  hair: {
    position: 'absolute',
    top: -2,
    width: 48,
    height: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#111827',
  },
  glasses: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  glassLens: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#111827',
    backgroundColor: 'transparent',
  },
  glassBridge: {
    width: 6,
    height: 2,
    backgroundColor: '#111827',
  },
  smile: {
    width: 12,
    height: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 1.8,
    borderColor: '#111827',
    borderTopWidth: 0,
    marginTop: 4,
  },
  bodyWrapper: {
    alignItems: 'center',
    marginTop: -4,
    zIndex: 3,
  },
  shirt: {
    width: 76,
    height: 44,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#111827',
  },
  arm: {
    position: 'absolute',
    width: 28,
    height: 12,
    borderWidth: 2.5,
    borderColor: '#111827',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    top: 16,
  },
  armLeft: {
    left: -14,
    transform: [{ rotate: '-25deg' }],
  },
  armRight: {
    right: -14,
    transform: [{ rotate: '25deg' }],
  },
  laptopScreen: {
    width: 110,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#111827',
    borderWidth: 2,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    zIndex: 6,
  },
  screenContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartLine: {
    width: 40,
    height: 2,
    backgroundColor: '#84E152',
    position: 'absolute',
    top: 12,
  },
  laptopLogo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  laptopBase: {
    width: 130,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1F2937',
    marginTop: -2,
    zIndex: 7,
  },
  deskShadow: {
    width: 140,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
    zIndex: 1,
  },
});
