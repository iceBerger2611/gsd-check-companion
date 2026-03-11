import {
  MD3LightTheme,
  configureFonts,
  type MD3Theme,
} from 'react-native-paper';

const fontConfig = {
  displayLarge: {
    fontFamily: 'System',
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 64,
    fontSize: 57,
  },
  displayMedium: {
    fontFamily: 'System',
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 52,
    fontSize: 45,
  },
  displaySmall: {
    fontFamily: 'System',
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 44,
    fontSize: 36,
  },
  headlineLarge: {
    fontFamily: 'System',
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 40,
    fontSize: 32,
  },
  headlineMedium: {
    fontFamily: 'System',
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 36,
    fontSize: 28,
  },
  headlineSmall: {
    fontFamily: 'System',
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 32,
    fontSize: 24,
  },
  titleLarge: {
    fontFamily: 'System',
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 28,
    fontSize: 22,
  },
  titleMedium: {
    fontFamily: 'System',
    fontWeight: '500' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
    fontSize: 16,
  },
  titleSmall: {
    fontFamily: 'System',
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
    fontSize: 14,
  },
  labelLarge: {
    fontFamily: 'System',
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
    fontSize: 14,
  },
  labelMedium: {
    fontFamily: 'System',
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
    fontSize: 12,
  },
  labelSmall: {
    fontFamily: 'System',
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
    fontSize: 11,
  },
  bodyLarge: {
    fontFamily: 'System',
    fontWeight: '400' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
    fontSize: 16,
  },
  bodyMedium: {
    fontFamily: 'System',
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 20,
    fontSize: 14,
  },
  bodySmall: {
    fontFamily: 'System',
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    lineHeight: 16,
    fontSize: 12,
  },
} as const;

export const appTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 8,
  fonts: configureFonts({ config: fontConfig, isV3: true }),
  colors: {
    ...MD3LightTheme.colors,

    primary: '#000000',
    onPrimary: '#FFFFFF',

    secondary: '#000000',
    onSecondary: '#FFFFFF',

    tertiary: '#000000',
    onTertiary: '#FFFFFF',

    background: '#FFFFFF',
    onBackground: '#000000',

    surface: '#FFFFFF',
    onSurface: '#000000',

    surfaceVariant: '#FFFFFF',
    onSurfaceVariant: '#6B7280',

    error: '#EF4444',
    onError: '#FFFFFF',

    outline: '#D4D4D8',
    outlineVariant: '#E4E4E7',

    shadow: '#000000',
    scrim: 'rgba(0,0,0,0.4)',

    inverseSurface: '#111111',
    inverseOnSurface: '#FFFFFF',
    inversePrimary: '#FFFFFF',

    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
  },
};