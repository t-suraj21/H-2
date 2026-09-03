import { colors, Colors } from './colors';
import { typography, Typography } from './typography';
import { spacing, radii, layout, Spacing, Radii, Layout } from './spacing';

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  layout,
};

export type Theme = typeof theme;
export { colors, typography, spacing, radii, layout };
export type { Colors, Typography, Spacing, Radii, Layout };
export default theme;
