import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackScreenProps } from '../navigation/types';
import { AuthIllustration } from '../components/auth/AuthIllustration';
import { SocialAuthButton } from '../components/auth/SocialAuthButton';

import { useAuth } from '../context/AuthContext';

export const WelcomeScreen: React.FC<AuthStackScreenProps<'Welcome'>> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { guestLogin } = useAuth();

  const handleGuestContinue = async () => {
    await guestLogin();
    navigation.getParent()?.navigate('Main');
  };

  const handleSocialContinue = async (provider: string) => {
    await guestLogin();
    navigation.getParent()?.navigate('Main');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Line-Art Illustration */}
        <View style={styles.illustrationWrapper}>
          <AuthIllustration />
        </View>

        {/* Headline & Description */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Price Intelligence</Text>
          <Text style={styles.subtitle}>
            Compare real-time prices across Amazon, Flipkart, & Croma. Never overpay again.
          </Text>
        </View>

        {/* 3-Segment Progress Pill Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressInactive]} />
        </View>

        {/* Social / Quick Action Buttons */}
        <View style={styles.actionsContainer}>
          <SocialAuthButton
            type="google"
            onPress={() => handleSocialContinue('google')}
          />
          <SocialAuthButton
            type="apple"
            onPress={() => handleSocialContinue('apple')}
          />
          <SocialAuthButton
            type="guest"
            onPress={handleGuestContinue}
          />
        </View>

        {/* Bottom Login Link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerPrompt}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#122E15', // Deep Forest Green
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
    maxWidth: 320,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
    marginVertical: 16,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: '#84E152', // Vibrant Matcha Green
  },
  progressInactive: {
    backgroundColor: '#EBF6E6', // Soft Mint Inactive
  },
  actionsContainer: {
    width: '100%',
    marginVertical: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  footerPrompt: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  footerLink: {
    fontSize: 14,
    color: '#122E15',
    fontWeight: '700',
  },
});
