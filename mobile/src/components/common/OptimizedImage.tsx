import React, { useState, memo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  ImageStyle,
  StyleProp,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { colors, radii } from '../../theme';
import { GoogleIcon } from './GoogleIcon';

interface OptimizedImageProps {
  source: { uri?: string | null } | number | null | undefined;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  fallbackIcon?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = memo(
  ({
    source,
    style,
    containerStyle,
    fallbackIcon = 'image',
    resizeMode = 'contain',
  }) => {
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    if (!source || hasError) {
      return (
        <View style={[styles.fallbackContainer, containerStyle]}>
          <GoogleIcon name={fallbackIcon as any} size={28} color={colors.text.muted} />
        </View>
      );
    }

    if (typeof source === 'object' && !source.uri) {
      return (
        <View style={[styles.fallbackContainer, containerStyle]}>
          <GoogleIcon name={fallbackIcon as any} size={28} color={colors.text.muted} />
        </View>
      );
    }

    const imageSource: ImageSourcePropType =
      typeof source === 'number'
        ? source
        : { uri: source.uri as string };

    return (
      <View style={[styles.container, containerStyle]}>
        <Image
          source={imageSource}
          style={[styles.image, style]}
          resizeMode={resizeMode}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setHasError(true);
          }}
        />
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.brand.primaryGlow} />
          </View>
        ) : null}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
});
