# Browser Back Button Should Close Image Viewer

**GitHub Issue:** [#5434](https://github.com/bluesky-social/social-app/issues/5434)
**Upvotes:** 22
**Category:** Bug Fix — Web UX
**Effort:** Low
**Scope:** Client-side only (web)

## Problem

On web, pressing the browser back button while viewing an image in the lightbox navigates away from the page instead of closing the lightbox. Users expect back to dismiss the overlay, similar to how it works on most image-heavy sites.

## Expected Behavior

- Opening the lightbox pushes a history state
- Pressing browser back closes the lightbox and pops the history state
- If the lightbox is already closed, back navigates normally
- Forward/back through multiple lightbox openings should work correctly

## Key Files

| File | Purpose |
|------|---------|
| `src/view/com/lightbox/Lightbox.web.tsx` | Web lightbox component — already handles Escape and arrow keys (lines 109-121), but no history API interaction |
| `src/state/lightbox.tsx` | Lightbox state — `openLightbox()` and `closeLightbox()` functions, tracks `activeLightbox` via context |

## Implementation Approach

### 1. Push History State on Open

In `openLightbox()` or the Lightbox component's mount effect:

```ts
useEffect(() => {
  if (activeLightbox) {
    window.history.pushState({ lightbox: true }, '')

    const handlePopState = (e: PopStateEvent) => {
      closeLightbox()
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }
}, [activeLightbox])
```

### 2. Clean Up on Manual Close

When the user closes the lightbox via Escape or the X button (not via back), pop the history state:

```ts
const handleClose = () => {
  if (window.history.state?.lightbox) {
    window.history.back()  // This triggers popstate which calls closeLightbox
  } else {
    closeLightbox()
  }
}
```

## Edge Cases

- Multiple lightbox opens without closing: each push adds a history entry — back should close the most recent
- Lightbox closed by Escape: must also pop the history state to keep history stack clean
- Navigation while lightbox is open: closing the lightbox shouldn't prevent the navigation
- Dialog over lightbox: if another dialog opens while lightbox is visible, history state must remain consistent
