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

// Teal-tinted contrast scale for light + dark themes
// Light bg: #EEF4F6 (teal off-white), Dark bg: #000000 (black)
const SHEERSKY_CONTRAST = {
  contrast_0: '#EEF4F6',
  contrast_25: '#E6EDF0',
  contrast_50: '#DAE5E9',
  contrast_100: '#C9D8DE',
  contrast_200: '#AFC2CA',
  contrast_300: '#95ACB6',
  contrast_400: '#7B96A2',
  contrast_500: '#627E8B',
  contrast_600: '#506773',
  contrast_700: '#3F525C',
  contrast_800: '#303F48',
  contrast_900: '#2B3A44',
  contrast_950: '#192328',
  contrast_975: '#11191E',
  contrast_1000: '#000000',
}

// Teal-tinted contrast scale for dim theme
// Dim bg: #233843 (dark teal)
const SHEERSKY_SUBDUED_CONTRAST = {
  contrast_0: '#FFFFFF',
  contrast_25: '#F7FBFC',
  contrast_50: '#EEF5F8',
  contrast_100: '#DDEAEF',
  contrast_200: '#C0D5DD',
  contrast_300: '#A5C0CB',
  contrast_400: '#8AAAB7',
  contrast_500: '#7093A1',
  contrast_600: '#5B7D8A',
  contrast_700: '#4A6773',
  contrast_800: '#3B535E',
  contrast_900: '#38505C',
  contrast_950: '#293B44',
  contrast_975: '#26363F',
  contrast_1000: '#233843',
}

const sheerskyPalette = {
  ...DEFAULT_PALETTE,
  ...SHEERSKY_PRIMARY,
  ...SHEERSKY_CONTRAST,
}
const sheerskySubduedPalette = {
  ...DEFAULT_SUBDUED_PALETTE,
  ...SHEERSKY_PRIMARY,
  ...SHEERSKY_SUBDUED_CONTRAST,
}

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
