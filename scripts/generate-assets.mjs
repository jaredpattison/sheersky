#!/usr/bin/env node
/**
 * SheerSky Asset Generator
 *
 * Generates all branding PNG assets from the mountain peak SVG logo.
 * Uses `sharp` (already in node_modules via @atproto/bsky).
 *
 * Usage:
 *   node scripts/generate-assets.mjs
 *
 * What it generates:
 *   - App icons (iOS + Android, default + flat variants)
 *   - Android adaptive icon layers (foreground, monochrome, notification)
 *   - Splash screens (iOS light/dark, Android)
 *   - Favicons (64, 32, 16, apple-touch-icon 180)
 *   - Social card
 *   - Logo
 */

import sharp from 'sharp'
import {mkdirSync, copyFileSync} from 'fs'
import {join, dirname} from 'path'
import {fileURLToPath} from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ─── SheerSky Brand Constants ────────────────────────────────────────────────

const COLORS = {
  primary: '#0284C7',       // Sky Cyan 500
  primaryLight: '#38BDF8',  // Sky Cyan 300
  primaryDark: '#075985',   // Sky Cyan 700
  primaryDeep: '#0C4A6E',   // Sky Cyan 800
  bgLight: '#EEF4F6',
  bgDark: '#000000',
  bgDim: '#233843',
  white: '#FFFFFF',
  black: '#000000',
}

// Mountain peak logo path (viewBox 0 0 64 64)
const PEAK_PATH = 'M6 56 L22 8 L30 30 L35 22 L40 30 L50 16 L58 56 Z'

// ─── SVG Builders ────────────────────────────────────────────────────────────

function logoSVG({size, fill, bg, padding = 0.2}) {
  const pad = size * padding
  const logoSize = size - pad * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
    <svg x="${pad}" y="${pad}" width="${logoSize}" height="${logoSize}" viewBox="0 0 64 64">
      <path fill="${fill}" d="${PEAK_PATH}"/>
    </svg>
  </svg>`
}

function logoGradientSVG({size, bg, padding = 0.2}) {
  const pad = size * padding
  const logoSize = size - pad * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${COLORS.primary}" stop-opacity="1"/>
        <stop offset="1" stop-color="${COLORS.primaryLight}" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <svg x="${pad}" y="${pad}" width="${logoSize}" height="${logoSize}" viewBox="0 0 64 64">
      <path fill="url(#sky)" d="${PEAK_PATH}"/>
    </svg>
  </svg>`
}

function splashSVG({width, height, logoBg, logoFill, bg}) {
  // Logo centered, roughly 200px wide on a 1170-wide canvas
  const logoSize = Math.round(width * 0.17)
  const x = (width - logoSize) / 2
  const y = (height - logoSize) / 2 - height * 0.05 // slightly above center
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${bg}"/>
    <svg x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" viewBox="0 0 64 64">
      <path fill="${logoFill}" d="${PEAK_PATH}"/>
    </svg>
  </svg>`
}

function socialCardSVG({width, height}) {
  const logoSize = 120
  const x = (width - logoSize) / 2
  const y = (height - logoSize) / 2 - 30
  // "SheerSky" text below the logo
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${COLORS.primaryDark}"/>
        <stop offset="1" stop-color="${COLORS.primary}"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <svg x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" viewBox="0 0 64 64">
      <path fill="${COLORS.white}" d="${PEAK_PATH}"/>
    </svg>
    <text x="${width / 2}" y="${y + logoSize + 50}" text-anchor="middle"
          font-family="Inter, system-ui, sans-serif" font-size="48" font-weight="700"
          fill="${COLORS.white}">SheerSky</text>
  </svg>`
}

// ─── Asset Generation ────────────────────────────────────────────────────────

async function generate(svgString, outputPath, width, height) {
  const dir = dirname(join(ROOT, outputPath))
  mkdirSync(dir, {recursive: true})

  const opts = height ? {width, height} : {width}
  await sharp(Buffer.from(svgString))
    .resize(opts)
    .png()
    .toFile(join(ROOT, outputPath))

  console.log(`  ✓ ${outputPath} (${width}${height ? `x${height}` : ''})`)
}

async function main() {
  console.log('SheerSky Asset Generator\n')

  // ── App Icons ──────────────────────────────────────────────────────────────
  console.log('App Icons:')

  // Default: gradient logo on primary background
  const defaultIcon = logoGradientSVG({size: 1024, bg: COLORS.primaryDeep, padding: 0.18})
  await generate(defaultIcon, 'assets/app-icons/ios_icon_default_next.png', 1024, 1024)
  await generate(defaultIcon, 'assets/app-icons/android_icon_default_next.png', 1024, 1024)

  // Flat variants
  const flatBlue = logoSVG({size: 1024, fill: COLORS.white, bg: COLORS.primary, padding: 0.2})
  await generate(flatBlue, 'assets/app-icons/ios_icon_core_flat_blue.png', 1024, 1024)
  await generate(flatBlue, 'assets/app-icons/android_icon_core_flat_blue.png', 1024, 1024)

  const flatWhite = logoSVG({size: 1024, fill: COLORS.primary, bg: COLORS.white, padding: 0.2})
  await generate(flatWhite, 'assets/app-icons/ios_icon_core_flat_white.png', 1024, 1024)
  await generate(flatWhite, 'assets/app-icons/android_icon_core_flat_white.png', 1024, 1024)

  const flatBlack = logoSVG({size: 1024, fill: COLORS.primary, bg: COLORS.black, padding: 0.2})
  await generate(flatBlack, 'assets/app-icons/ios_icon_core_flat_black.png', 1024, 1024)
  await generate(flatBlack, 'assets/app-icons/android_icon_core_flat_black.png', 1024, 1024)

  // ── Android Adaptive Icon ──────────────────────────────────────────────────
  console.log('\nAndroid Adaptive Icon:')

  // Foreground: logo on transparent, with extra padding for safe zone
  const fgSvg = logoGradientSVG({size: 1024, bg: null, padding: 0.30})
  await generate(fgSvg, 'assets/icon-android-foreground.png', 1024, 1024)

  // Monochrome: white logo on transparent
  const monoSvg = logoSVG({size: 1024, fill: COLORS.white, bg: null, padding: 0.30})
  await generate(monoSvg, 'assets/icon-android-monochrome.png', 1024, 1024)

  // Notification: small white logo on transparent
  const notifSvg = logoSVG({size: 96, fill: COLORS.white, bg: null, padding: 0.15})
  await generate(notifSvg, 'assets/icon-android-notification.png', 96, 96)

  // ── Splash Screens ─────────────────────────────────────────────────────────
  console.log('\nSplash Screens:')

  const splashLight = splashSVG({
    width: 1170, height: 2529,
    bg: COLORS.bgLight, logoFill: COLORS.primary,
  })
  await generate(splashLight, 'assets/splash/splash.png', 1170, 2529)

  const splashDark = splashSVG({
    width: 1170, height: 2529,
    bg: COLORS.bgDark, logoFill: COLORS.primaryLight,
  })
  await generate(splashDark, 'assets/splash/splash-dark.png', 1170, 2529)

  // Android: just the logo mark, white on transparent
  const androidSplash = logoSVG({size: 306, fill: COLORS.white, bg: null, padding: 0.05})
  await generate(androidSplash, 'assets/splash/android-splash-logo-white.png', 306, 271)

  // ── Favicons ───────────────────────────────────────────────────────────────
  console.log('\nFavicons:')

  const faviconSvg = logoSVG({size: 64, fill: COLORS.primary, bg: null, padding: 0.05})
  await generate(faviconSvg, 'assets/favicon.png', 64, 64)

  const touchIconSvg = logoGradientSVG({size: 180, bg: COLORS.primaryDeep, padding: 0.15})
  await generate(touchIconSvg, 'bskyweb/static/apple-touch-icon.png', 180, 180)

  const fav32 = logoSVG({size: 32, fill: COLORS.primary, bg: null, padding: 0.05})
  await generate(fav32, 'bskyweb/static/favicon-32x32.png', 32, 32)

  const fav16 = logoSVG({size: 16, fill: COLORS.primary, bg: null, padding: 0.0})
  await generate(fav16, 'bskyweb/static/favicon-16x16.png', 16, 16)

  // Copy main favicon to web directories
  copyFileSync(join(ROOT, 'assets/favicon.png'), join(ROOT, 'bskyweb/static/favicon.png'))
  console.log('  ✓ bskyweb/static/favicon.png (copied)')
  copyFileSync(join(ROOT, 'assets/favicon.png'), join(ROOT, 'bskyweb/embedr-static/favicon.png'))
  console.log('  ✓ bskyweb/embedr-static/favicon.png (copied)')
  copyFileSync(join(ROOT, 'bskyweb/static/favicon-32x32.png'), join(ROOT, 'bskyweb/embedr-static/favicon-32x32.png'))
  console.log('  ✓ bskyweb/embedr-static/favicon-32x32.png (copied)')
  copyFileSync(join(ROOT, 'bskyweb/static/favicon-16x16.png'), join(ROOT, 'bskyweb/embedr-static/favicon-16x16.png'))
  console.log('  ✓ bskyweb/embedr-static/favicon-16x16.png (copied)')

  // ── Logo & Social Card ─────────────────────────────────────────────────────
  console.log('\nMisc:')

  const logoFile = logoGradientSVG({size: 500, bg: null, padding: 0.05})
  await generate(logoFile, 'assets/logo.png', 500, 441)

  const card = socialCardSVG({width: 1200, height: 630})
  await generate(card, 'bskyweb/static/social-card-default.png', 1200, 630)

  // ── Theme Variants (gradient backgrounds) ──────────────────────────────────
  console.log('\nTheme Icon Variants:')

  const themes = {
    aurora:   {bg: 'linear', colors: ['#1B4D3E', '#0F766E', '#2DD4BF']},
    bonfire:  {bg: 'linear', colors: ['#7C2D12', '#DC2626', '#FB923C']},
    sunrise:  {bg: 'linear', colors: ['#1E3A5F', '#F97316', '#FDE68A']},
    sunset:   {bg: 'linear', colors: ['#312E81', '#7C3AED', '#F472B6']},
    midnight: {bg: 'linear', colors: ['#0F172A', '#1E293B', '#334155']},
  }

  for (const [name, theme] of Object.entries(themes)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="bg-${name}" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0" stop-color="${theme.colors[0]}"/>
          <stop offset="0.5" stop-color="${theme.colors[1]}"/>
          <stop offset="1" stop-color="${theme.colors[2]}"/>
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#bg-${name})"/>
      <svg x="184" y="184" width="656" height="656" viewBox="0 0 64 64">
        <path fill="${COLORS.white}" d="${PEAK_PATH}" opacity="0.95"/>
      </svg>
    </svg>`

    await generate(svg, `assets/app-icons/ios_icon_core_${name}.png`, 1024, 1024)
    await generate(svg, `assets/app-icons/android_icon_core_${name}.png`, 1024, 1024)
  }

  // Classic: the logo with a radial glow
  const classicSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <radialGradient id="glow" cx="0.5" cy="0.45" r="0.6">
        <stop offset="0" stop-color="${COLORS.primaryLight}"/>
        <stop offset="1" stop-color="${COLORS.primaryDark}"/>
      </radialGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#glow)"/>
    <svg x="184" y="184" width="656" height="656" viewBox="0 0 64 64">
      <path fill="${COLORS.white}" d="${PEAK_PATH}"/>
    </svg>
  </svg>`
  await generate(classicSvg, 'assets/app-icons/ios_icon_core_classic.png', 1024, 1024)
  await generate(classicSvg, 'assets/app-icons/android_icon_core_classic.png', 1024, 1024)

  console.log('\n✅ All assets generated!')
  console.log('\nNote: Legacy icons (ios_icon_legacy_*, android_icon_legacy_*) were not regenerated.')
  console.log('If you need them, duplicate the default icons or run this script again with modifications.')
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
