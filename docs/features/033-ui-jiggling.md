# UI Jiggling / Visual Instability During Scroll

**GitHub Issue:** [#2600](https://github.com/bluesky-social/social-app/issues/2600)
**Category:** Bug Fix — Visual Polish
**Effort:** Low
**Scope:** Client-side only

## Problem

Timeline elements shift up and down by approximately one pixel during scrolling, creating a subtle but annoying visual jitter. This is a layout calculation or rendering precision issue.

## Expected Behavior

- Feed items remain visually stable during scroll
- No sub-pixel jittering or layout shifts
- Smooth, stable scrolling on all platforms

## Key Files

| File | Purpose |
|------|---------|
| `src/view/com/posts/PostFeed.tsx` | Feed list — item rendering |
| `src/view/com/util/List.tsx` | List component — scroll handling |

## Implementation Approach

### 1. Investigate Root Cause

Common causes:
- **Sub-pixel rounding:** Layout calculations produce fractional pixels. Different elements round differently, causing 1px shifts
- **Dynamic height calculation:** If item heights are measured asynchronously and adjusted, this causes layout shifts
- **Border rendering:** 1px borders at fractional positions shift during scroll
- **Sticky headers:** Header show/hide animations affecting content position

### 2. Potential Fixes

**Fix A:** Round layout dimensions to whole pixels:
```ts
style={{ height: Math.round(calculatedHeight) }}
```

**Fix B:** Use `getItemLayout` on FlatList to provide fixed heights and avoid dynamic measurement

**Fix C:** Ensure borders use `hairlineWidth` (which is device-pixel-aligned):
```ts
import { StyleSheet } from 'react-native'
borderWidth: StyleSheet.hairlineWidth
```

**Fix D:** Check Reanimated header animation — ensure it uses integer pixel offsets

## Edge Cases

- Device-specific: may be more visible on certain screen densities
- Platform-specific: iOS and Android render sub-pixels differently
- Affected by font rendering: text baseline shifts can cause line-height jitter
