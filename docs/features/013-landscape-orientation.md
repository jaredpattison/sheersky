# Remove Portrait Orientation Lock

**GitHub Issue:** [#1872](https://github.com/bluesky-social/social-app/issues/1872)
**Upvotes:** 22
**Category:** Feature — Mobile UX
**Effort:** Medium
**Scope:** Client-side only

## Problem

The app is locked to portrait orientation on phones. Users with tablets or who prefer landscape mode cannot rotate the app. This is especially frustrating for iPad users and when viewing media.

## Expected Behavior

- App supports both portrait and landscape orientations
- Layouts adapt gracefully to landscape proportions
- Video fullscreen uses landscape naturally
- Option to lock orientation if users prefer portrait-only

## Key Files

| File | Purpose |
|------|---------|
| `app.config.js` | Expo config — `orientation` property controls allowed orientations |
| `src/view/shell/` | Shell layout — tab bar, headers need landscape-aware styling |
| `src/alf/atoms.ts` | ALF atoms — layout atoms may need landscape variants |

## Implementation Approach

### 1. Unlock Orientation

In `app.config.js`, change orientation from `"portrait"` to `"default"` (allows both):

```js
orientation: 'default',
```

### 2. Layout Adjustments

Key areas that need landscape support:
- Bottom tab bar: may need to become a side rail in landscape
- Composer dialog: ensure it doesn't overflow in landscape height
- Thread view: wider content area in landscape
- Image viewer: already handles landscape naturally

### 3. Responsive Hooks

Leverage existing breakpoint system and add orientation detection:

```ts
import { useWindowDimensions } from 'react-native'

const { width, height } = useWindowDimensions()
const isLandscape = width > height
```

## Edge Cases

- Small phones in landscape: very limited vertical space — bottom sheets and dialogs may need adaptation
- Keyboard in landscape: significantly reduces visible area
- Tab bar position: consider moving to side in landscape (like iPad apps)
- Video player: should use landscape for fullscreen playback
- Orientation change during compose: preserve draft content and cursor position
