// constants/theme.ts

export interface ColorScheme {
  readonly background: string;
  readonly surface: string;
  readonly text: string;
  readonly textMuted: string;
  readonly border: string;
  
  // Core Branding Purple Theme Colors
  readonly primary: string;
  readonly primaryLight: string;
  readonly primaryDark: string;
  
  // Gradient definitions (typed as strict tuples for expo-linear-gradient compatibility)
  readonly bgGradient: readonly [string, string, ...string[]];
  readonly activeDayGradient: readonly [string, string, ...string[]];
  readonly dailyTipGradient: readonly [string, string, ...string[]];
  
  // Status colors
  readonly onTrack: string;
  readonly warning: string;
  readonly danger: string;
}

export const ThemeColors: {
  readonly light: ColorScheme;
  readonly dark: ColorScheme;
} = {
  light: {
    background: '#FAF9F6',
    surface: '#FFFFFF',
    text: '#1A1A18',
    textMuted: '#88837B',
    border: '#F0EDE8',
    
    primary: '#8B5CF6',         // Main Brand Purple
    primaryLight: '#C4B5FD',    // Light Purple
    primaryDark: '#6D28D9',     // Deep Purple
    
    bgGradient: ['#F5F3FF', '#EDE9FE', '#F8FAFC'],  // Refreshing purplish bg gradient
    activeDayGradient: ['#8B5CF6', '#A78BFA'],
    dailyTipGradient: ['#8B5CF6', '#A78BFA'],
    
    onTrack: '#8B5CF6',
    warning: '#FFAA33',
    danger: '#FF5C5C',
  },
  dark: {
    background: '#1A1A18',
    surface: '#242422',
    text: '#FFFFFF',
    textMuted: '#AAA49C',
    border: '#2C2C2A',
    
    primary: '#A78BFA',         // Light Purple for Dark Mode
    primaryLight: '#C4B5FD',
    primaryDark: '#7C3AED',
    
    bgGradient: ['#1A1A18', '#241B2E', '#1B242E'],
    activeDayGradient: ['#A78BFA', '#4C1D95'],
    dailyTipGradient: ['#312E81', '#A78BFA'],
    
    onTrack: '#A78BFA',
    warning: '#FFAA33',
    danger: '#FF5C5C',
  }
};
