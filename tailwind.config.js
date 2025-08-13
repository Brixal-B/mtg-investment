/** @type {import('tailwindcss').Config} */

// Design tokens (manually imported due to TypeScript)
const designTokens = {
  colors: {
    primary: {
      50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
      500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a',
    },
    secondary: {
      50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8',
      500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a',
    },
    success: {
      50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80',
      500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d',
    },
    warning: {
      50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24',
      500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f',
    },
    error: {
      50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171',
      500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d',
    },
    mtg: {
      white: '#fffbd5', blue: '#0e68ab', black: '#150b00', red: '#d3202a', green: '#00733e',
      colorless: '#ccc2c0', common: '#1e1e1e', uncommon: '#c0c0c0', rare: '#ffb300',
      mythic: '#ff8c00', mint: '#22c55e', nearMint: '#65a30d', excellent: '#eab308',
      good: '#f97316', lightPlayed: '#ef4444', played: '#dc2626', poor: '#991b1b',
    },
  },
  breakpoints: {
    sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px',
  },
  zIndex: {
    hide: -1, auto: 'auto', base: 0, docked: 10, dropdown: 1000, sticky: 1100,
    banner: 1200, overlay: 1300, modal: 1400, popover: 1500, skipLink: 1600,
    toast: 1700, tooltip: 1800,
  },
};

module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: designTokens.colors.primary,
        secondary: designTokens.colors.secondary,
        success: designTokens.colors.success,
        warning: designTokens.colors.warning,
        error: designTokens.colors.error,
        mtg: designTokens.colors.mtg,
      },
      screens: designTokens.breakpoints,
      zIndex: designTokens.zIndex,
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
      },
    },
  },
  plugins: [],
};
