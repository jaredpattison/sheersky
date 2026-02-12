import {
  createThemes,
  DEFAULT_PALETTE,
  DEFAULT_SUBDUED_PALETTE,
} from '@bsky.app/alf'

const SHEERSKY_PRIMARY = {
  primary_25: '#F0F9FF',
  primary_50: '#E0F2FE',
  primary_100: '#BAE6FD',
  primary_200: '#7DD3FC',
  primary_300: '#38BDF8',
  primary_400: '#0EA5E9',
  primary_500: '#0284C7',
  primary_600: '#0369A1',
  primary_700: '#075985',
  primary_800: '#0C4A6E',
  primary_900: '#0C3B5A',
  primary_950: '#082C44',
  primary_975: '#051E2F',
}

const sheerskyPalette = {...DEFAULT_PALETTE, ...SHEERSKY_PRIMARY}
const sheerskySubduedPalette = {...DEFAULT_SUBDUED_PALETTE, ...SHEERSKY_PRIMARY}

const DEFAULT_THEMES = createThemes({
  defaultPalette: sheerskyPalette,
  subduedPalette: sheerskySubduedPalette,
})

export const themes = {
  lightPalette: DEFAULT_THEMES.light.palette,
  darkPalette: DEFAULT_THEMES.dark.palette,
  dimPalette: DEFAULT_THEMES.dim.palette,
  light: DEFAULT_THEMES.light,
  dark: DEFAULT_THEMES.dark,
  dim: DEFAULT_THEMES.dim,
}

/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const lightPalette = DEFAULT_THEMES.light.palette
/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const darkPalette = DEFAULT_THEMES.dark.palette
/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const dimPalette = DEFAULT_THEMES.dim.palette
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const light = DEFAULT_THEMES.light
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const dark = DEFAULT_THEMES.dark
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const dim = DEFAULT_THEMES.dim
