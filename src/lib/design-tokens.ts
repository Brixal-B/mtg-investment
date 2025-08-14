/**
 * Design Tokens for MTG Investment Platform
 * Standardized color palette, spacing, and typography
 */

// Color Palette
export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Main brand blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Secondary Colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Semantic Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // Success green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // Warning amber
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // Error red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // MTG-specific colors
  mtg: {
    // Mana colors
    white: '#fffbd5',
    blue: '#0e68ab',
    black: '#150b00',
    red: '#d3202a',
    green: '#00733e',
    colorless: '#ccc2c0',
    
    // Rarity colors
    common: '#1e1e1e',
    uncommon: '#c0c0c0',
    rare: '#ffb300',
    mythic: '#ff8c00',
    
    // Card conditions
    mint: '#22c55e',
    nearMint: '#65a30d',
    excellent: '#eab308',
    good: '#f97316',
    lightPlayed: '#ef4444',
    played: '#dc2626',
    poor: '#991b1b',
  }
};

// Spacing Scale
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

// Typography Scale
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    serif: ['Georgia', 'serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
  },
  
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
};

// Component Tokens
export const components = {
  button: {
    primary: {
      backgroundColor: colors.primary[600],
      color: 'white',
      hoverBackgroundColor: colors.primary[700],
      focusRingColor: colors.primary[500],
    },
    secondary: {
      backgroundColor: colors.secondary[100],
      color: colors.secondary[900],
      hoverBackgroundColor: colors.secondary[200],
      focusRingColor: colors.secondary[500],
    },
    success: {
      backgroundColor: colors.success[600],
      color: 'white',
      hoverBackgroundColor: colors.success[700],
      focusRingColor: colors.success[500],
    },
    warning: {
      backgroundColor: colors.warning[500],
      color: 'white',
      hoverBackgroundColor: colors.warning[600],
      focusRingColor: colors.warning[400],
    },
    danger: {
      backgroundColor: colors.error[600],
      color: 'white',
      hoverBackgroundColor: colors.error[700],
      focusRingColor: colors.error[500],
    },
  },
  
  card: {
    backgroundColor: 'white',
    borderColor: colors.secondary[200],
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    darkBackgroundColor: colors.secondary[800],
    darkBorderColor: colors.secondary[700],
  },
  
  input: {
    borderColor: colors.secondary[300],
    focusBorderColor: colors.primary[500],
    focusRingColor: colors.primary[500],
    placeholderColor: colors.secondary[400],
  },
  
  navigation: {
    backgroundColor: colors.secondary[900],
    borderColor: colors.secondary[800],
    activeColor: colors.primary[500],
    hoverColor: colors.secondary[700],
  },
};

// Animation Tokens
export const animations = {
  transition: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
  
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Z-index Scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

export default {
  colors,
  spacing,
  typography,
  components,
  animations,
  breakpoints,
  zIndex,
};
