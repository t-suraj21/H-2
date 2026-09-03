import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { GoogleIcon } from './GoogleIcon';
import { watchlistApi } from '../../services/productApi';
import { useAuth } from '../../context/AuthContext';

interface TrackPriceButtonProps {
  productId?: string;
  productTitle?: string;
  currentPrice?: number;
  targetPrice?: number;
  productData?: {
    title?: string;
    brand?: string;
    model?: string;
    category?: string;
    image?: string;
    price?: number;
    mrp?: number;
  };
  initialIsTracked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  onTrackChanged?: (isTracked: boolean) => void;
}

export const TrackPriceButton: React.FC<TrackPriceButtonProps> = ({
  productId,
  productTitle,
  currentPrice,
  targetPrice,
  productData,
  initialIsTracked = false,
  size = 'md',
  style,
  onTrackChanged,
}) => {
  const { token, isAuthenticated } = useAuth();
  const [isTracked, setIsTracked] = useState(initialIsTracked);
  const [loading, setLoading] = useState(false);

  const handleToggleWatchlist = async () => {
    if (!isAuthenticated || !token) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to add products to your watchlist and track price drops.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);

    try {
      if (isTracked && productId) {
        // Remove from watchlist
        const res = await watchlistApi.removeFromWatchlist(productId, token);
        if (res.success) {
          setIsTracked(false);
          if (onTrackChanged) onTrackChanged(false);
        } else {
          Alert.alert('Error', res.message || 'Could not remove from watchlist.');
        }
      } else {
        // Add to watchlist
        const payload = {
          productId,
          targetPrice: targetPrice || (currentPrice ? Math.round(currentPrice * 0.9) : undefined),
          productData: {
            title: productTitle || productData?.title,
            brand: productData?.brand,
            model: productData?.model,
            category: productData?.category,
            image: productData?.image,
            price: currentPrice || productData?.price,
            mrp: productData?.mrp,
          },
        };

        const res = await watchlistApi.addToWatchlist(payload, token);
        if (res.success) {
          setIsTracked(true);
          if (onTrackChanged) onTrackChanged(true);
        } else {
          Alert.alert('Error', res.message || 'Could not add to watchlist.');
        }
      }
    } catch (err) {
      Alert.alert('Network Error', 'Failed to update watchlist tracking.');
    } finally {
      setLoading(false);
    }
  };

  const isSmall = size === 'sm';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handleToggleWatchlist}
      disabled={loading}
      style={[
        styles.button,
        isSmall ? styles.buttonSm : styles.buttonMd,
        isTracked ? styles.buttonTracked : styles.buttonUntracked,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isTracked ? colors.status.success : colors.brand.primaryGlow}
        />
      ) : (
        <>
          <GoogleIcon
            name={isTracked ? 'bookmark' : 'bookmark-border'}
            size={isSmall ? 16 : 18}
            color={isTracked ? colors.status.success : colors.brand.primaryGlow}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.text,
              isSmall ? styles.textSm : styles.textMd,
              isTracked ? styles.textTracked : styles.textUntracked,
            ]}
          >
            {isTracked ? 'Tracking Price' : 'Track Price'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
  },
  buttonSm: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  buttonMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonUntracked: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: colors.border.brand,
  },
  buttonTracked: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.border.success,
  },
  text: {
    fontWeight: typography.fontWeights.semibold,
  },
  textSm: {
    fontSize: typography.fontSizes.xs,
  },
  textMd: {
    fontSize: typography.fontSizes.sm,
  },
  textUntracked: {
    color: colors.brand.primaryGlow,
  },
  textTracked: {
    color: colors.status.success,
  },
});
