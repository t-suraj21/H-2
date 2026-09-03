export const colors = {
  // Backgrounds
  background: {
    primary: '#0B0F19',
    secondary: '#111827',
    card: '#1F2937',
    cardHover: '#374151',
    cardGlass: 'rgba(31, 41, 55, 0.75)',
    overlay: 'rgba(0, 0, 0, 0.65)',
    input: '#151D2A',
  },

  // Brand Accents
  brand: {
    primary: '#3B82F6',       // Electric Blue
    primaryGlow: '#60A5FA',
    secondary: '#10B981',     // Emerald Green
    accent: '#8B5CF6',        // Violet
    cyan: '#06B6D4',          // Cyber Cyan
    amber: '#F59E0B',         // Warm Amber
  },

  // Text Colors
  text: {
    primary: '#F9FAFB',
    secondary: '#9CA3AF',
    muted: '#6B7280',
    inverse: '#111827',
    brand: '#60A5FA',
    success: '#34D399',
    error: '#F87171',
  },

  // Borders & Dividers
  border: {
    subtle: '#1E293B',
    default: '#374151',
    highlight: '#4B5563',
    brand: 'rgba(59, 130, 246, 0.4)',
    success: 'rgba(16, 185, 129, 0.4)',
  },

  // Status Colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
} as const;

export type Colors = typeof colors;
