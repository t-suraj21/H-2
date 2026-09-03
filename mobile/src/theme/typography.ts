import { TextStyle } from 'react-native';

export const typography = {
  fontSizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 38,
    display: 48,
  },
  fontWeights: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    extraBold: '800' as TextStyle['fontWeight'],
  },
  lineHeights: {
    tight: 1.15,
    normal: 1.35,
    relaxed: 1.5,
  },
} as const;

export type Typography = typeof typography;
