import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { RootStackScreenProps } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export const SplashScreen: React.FC<RootStackScreenProps<'Splash'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading } = useAuth();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

  }, [fadeAnim, scaleAnim, progressAnim, isAuthenticated, isLoading, navigation]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      {/* Main Visual & Content Card */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Realistic 3D Hero Graphic */}
        <View style={styles.imageCard}>
          <View style={styles.imageGlow} />
          <Image
            source={require('../../assets/splash-hero.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Headline & Description */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Compare. Analyze.{'\n'}Buy Smarter.</Text>
          <Text style={styles.subtitle}>
            Real-time cross-store price tracking & verified deal alerts across top retailers.
          </Text>
        </View>



        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Sign In / Register</Text>
            <GoogleIcon name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <View style={styles.quickLinksRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
              style={styles.linkButton}
              activeOpacity={0.7}
            >
              <Text style={styles.linkButtonText}>Log In</Text>
            </TouchableOpacity>
            <View style={styles.linkDivider} />
            <TouchableOpacity
              onPress={() => navigation.navigate('Auth', { screen: 'Register' })}
              style={styles.linkButton}
              activeOpacity={0.7}
            >
              <Text style={styles.linkButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Footer Meta */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>HL² Intelligence Engine v1.0.0 • Verified Deals</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topHeader: {
    alignItems: 'center',
    paddingTop: 8,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3FAF0',
    borderColor: '#E8EFE5',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  badgeLogoText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#122E15',
  },
  badgeLogoSup: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: -4,
  },
  brandName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#122E15',
    letterSpacing: 0.8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  imageCard: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  imageGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(132, 225, 82, 0.15)',
    zIndex: -1,
  },
  heroImage: {
    width: Math.min(width * 0.65, 250),
    height: Math.min(width * 0.65, 250),
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#EBF6E6',
    shadowColor: '#122E15',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#122E15', // Deep Forest Green matching Login/Welcome
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  statusContainer: {
    width: '100%',
    maxWidth: 290,
    alignItems: 'center',
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EBF6E6', // Soft Mint inactive track
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#84E152', // Vibrant Matcha Green active fill
    borderRadius: 2,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#122E15', // Deep Forest Green matching Login
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#122E15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  quickLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  linkButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  linkButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  linkDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E5E7EB',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

