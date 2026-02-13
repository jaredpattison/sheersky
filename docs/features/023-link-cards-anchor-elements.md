# Link Preview Cards as Proper Anchor Elements

**GitHub Issue:** [#995](https://github.com/bluesky-social/social-app/issues/995)
**Category:** Bug Fix — Web Accessibility / UX
**Effort:** Low
**Scope:** Client-side only (web)

## Problem

Link preview cards (external link embeds) are rendered as `<div>` elements with JavaScript click handlers on web. This means Cmd+click (open in new tab), right-click context menu ("Copy link address", "Open in new tab"), and middle-click don't work as expected.

## Expected Behavior

- Link preview cards render as `<a>` elements on web with proper `href`
- Cmd+click opens in a new tab
- Right-click shows browser context menu with link options
- Middle-click opens in a new tab
- Screen readers announce it as a link

## Key Files

| File | Purpose |
|------|---------|
| `src/components/Post/Embed/ExternalEmbed/index.tsx` | External link embed — wraps content in `<Link>` component from `#/components/Link` (line 77+). The `Link` component renders via `<Button>` with `role="link"` |
| `src/components/Link.tsx` | Link component — uses `<Button>` which renders as `<Pressable>`. On web, passes `hrefAttrs` (lines 305-314) but calls `e.preventDefault()` on click |
| `src/components/Button.tsx` | Button component — the underlying `<Pressable>` on web may or may not render as `<a>` depending on React Native Web behavior |

## Root Cause

The `Link` component prevents default browser behavior (`e.preventDefault()`) and handles navigation in JavaScript. For external links, this breaks native browser link behaviors because the `<a>` tag's default click is suppressed.

## Implementation Approach

For external links specifically, allow the browser's default link behavior:

```tsx
// In ExternalEmbed or Link component, for external URLs:
// Don't preventDefault on the click event
// Ensure the rendered element is <a> with href

// Option 1: Use a raw <a> tag for external embeds on web
{IS_WEB ? (
  <a
    href={link.uri}
    target="_blank"
    rel="noopener noreferrer"
    style={cardStyles}
  >
    {cardContent}
  </a>
) : (
  <Pressable onPress={() => openLink(link.uri)}>
    {cardContent}
  </Pressable>
)}
```

Or modify the `Link` component to not `preventDefault` when the link is external and the event has modifier keys (Cmd, Ctrl, middle button):

```ts
const handlePress = (e: GestureResponderEvent) => {
  const nativeEvent = (e as any).nativeEvent as MouseEvent
  if (isExternal && (nativeEvent.metaKey || nativeEvent.ctrlKey || nativeEvent.button === 1)) {
    // Let browser handle it natively
    return
  }
  e.preventDefault()
  // Handle navigation in JS
}
```

## Edge Cases

- Internal links (bsky.app URLs): should still use JS navigation, not browser navigation
- Touch devices: no right-click context menu, so JS handling is fine
- Accessibility: `<a>` elements are better for screen readers than `<div role="link">`
- Link tracking/analytics: if any click tracking exists, ensure it still fires
