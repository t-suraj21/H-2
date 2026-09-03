export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

export const layout = {
  screenPadding: 18,
  cardPadding: 16,
  tabBarHeight: 70,
  tabBarBottomOffset: 85,
} as const;

export type Spacing = typeof spacing;
export type Radii = typeof radii;
export type Layout = typeof layout;
