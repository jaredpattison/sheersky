# Custom Accent Color

**GitHub Issue:** [#5181](https://github.com/bluesky-social/social-app/issues/5181)
**Upvotes:** 20
**Category:** Feature — Appearance / Personalization
**Effort:** Medium
**Scope:** Client-side only

## Problem

Users want to personalize the app's primary/accent color instead of being locked to the default blue (or SheerSky's cyan).

## Expected Behavior

- In Settings > Appearance, a color picker for the primary accent
- Preset options: Sky Cyan (default), Ocean Blue, Purple, Green, Rose, Orange, etc.
- Custom hex input for power users
- Accent color applies to: active tab icons, buttons, links, focus rings, switches, selection highlights
- Theme (light/dark/dim) continues to work independently of accent color

## Key Files

| File | Purpose |
|------|---------|
| `src/alf/themes.ts` | Theme definitions — `SHEERSKY_PRIMARY` scale defines the 13-shade primary palette. A custom accent would replace this scale |
| `src/alf/tokens.ts` | Design tokens — gradients use primary palette values |
| `src/state/persisted/schema.ts` | Persisted preferences — store selected accent |

## Implementation Approach

### 1. Accent Presets

Define preset accent scales (each a 13-shade palette like `SHEERSKY_PRIMARY`):

```ts
const ACCENT_PRESETS = {
  cyan: SHEERSKY_PRIMARY,        // current default
  blue: BLUESKY_PRIMARY,         // original Bluesky blue
  purple: { primary_25: '...', primary_50: '...', ... },
  green:  { ... },
  rose:   { ... },
  orange: { ... },
}
```

### 2. Dynamic Theme Generation

Modify `createTheme()` in `themes.ts` to accept an accent palette parameter:

```ts
function createTheme(base: 'light' | 'dark' | 'dim', accent: PrimaryScale): Theme {
  // Use accent instead of hardcoded SHEERSKY_PRIMARY
}
```

### 3. Preference + Context

```ts
// src/state/persisted/schema.ts
accentColor: z.string().optional().default('cyan')
```

The theme provider reads the accent preference and generates the theme with the selected palette.

### 4. Color Picker UI

A row of preset color circles in Settings > Appearance, with a "Custom" option that opens a hex input or color wheel.

## Edge Cases

- Contrast ratios: ensure all accent colors meet WCAG AA contrast requirements against light/dark backgrounds
- Custom hex: need to generate a full 13-shade scale from a single hex — use HSL interpolation
- Gradients: primary gradients in `tokens.ts` need to update with the accent
- Legacy colors: `src/lib/styles.ts` hardcoded colors should also respect the accent
- Social card / splash: these are static assets and won't change with accent color
