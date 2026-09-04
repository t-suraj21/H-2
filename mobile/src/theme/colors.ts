export const colors = {
  // Backgrounds - Clean, Fresh White & Subtle Slate/Blue Tints
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    surface: '#EFF6FF',
    card: '#FFFFFF',
    cardHover: '#EFF6FF',
    cardGlass: 'rgba(255, 255, 255, 0.95)',
    overlay: 'rgba(15, 23, 42, 0.5)',
    input: '#F8FAFC',
    inputFocus: '#FFFFFF',
  },

  // Brand Accents - Midnight Slate Navy & Vivid Electric Blue
  brand: {
    primary: '#0F172A',       // Deep Slate Navy (Signature HL² Primary)
    primaryGlow: '#2563EB',   // Vivid Electric Blue
    secondary: '#2563EB',     // Royal Blue Accent
    accent: '#0284C7',        // Ocean Blue
    navy: '#0F172A',
    blue: '#2563EB',
    forest: '#0F172A',        // backward-compat mapping
    emerald: '#2563EB',       // backward-compat mapping
    light: '#EFF6FF',         // Ice Blue Badge Background
    lightBorder: '#DBEAFE',   // Subtle Brand Border
    cyan: '#0284C7',          // Clean Sky/Cyan
    amber: '#F59E0B',         // Warm Gold
  },

  // Text Colors
  text: {
    primary: '#0F172A',       // Deep Midnight Dark
    secondary: '#475569',     // Slate Gray
    muted: '#94A3B8',         // Light Slate
    inverse: '#FFFFFF',       // Pure White
    brand: '#2563EB',         // Royal Blue
    forest: '#0F172A',
    success: '#10B981',
    error: '#EF4444',
  },

  // Borders & Dividers
  border: {
    subtle: '#E2E8F0',        // Soft Slate-Blue Gray
    default: '#E2E8F0',       // Neutral Slate Gray
    highlight: '#2563EB',     // Royal Blue Highlight
    brand: '#0F172A',         // Slate Navy Dark
    success: 'rgba(37, 99, 235, 0.25)',
  },

  // Status Colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#2563EB',
  },
} as const;

export type Colors = typeof colors;

