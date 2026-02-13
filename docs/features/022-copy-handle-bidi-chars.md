# Copying Handles Includes Invisible Unicode Bidi Characters

**GitHub Issue:** [#8451](https://github.com/bluesky-social/social-app/issues/8451)
**Upvotes:** 3
**Category:** Bug Fix — Web
**Effort:** Low
**Scope:** Client-side only (web)

## Problem

When copying a user's handle on web, invisible Unicode bidirectional (bidi) control characters are included in the copied text. This causes issues when pasting the handle elsewhere (search, mentions, URLs).

## Expected Behavior

- Copying a handle produces clean ASCII text: `username.bsky.social`
- No invisible Unicode characters (`U+200E`, `U+200F`, `U+202A`-`U+202E`, `U+2066`-`U+2069`) in copied text

## Key Files

| File | Purpose |
|------|---------|
| `src/components/Typography.tsx` | Text rendering — may wrap handles in bidi markers for RTL language support |
| `src/view/com/util/UserHandle.tsx` or similar | Handle display component |

## Implementation Approach

### Option A: Strip on Render

Ensure handle text is rendered without bidi markers:

```tsx
const cleanHandle = handle.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
```

### Option B: Custom Copy Handler

Add an `onCopy` handler that strips bidi characters from the clipboard data:

```tsx
const handleCopy = (e: ClipboardEvent) => {
  const selection = window.getSelection()?.toString()
  if (selection) {
    const cleaned = selection.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    e.clipboardData?.setData('text/plain', cleaned)
    e.preventDefault()
  }
}
```

### Option C: Unicode Isolation

If bidi markers are needed for display (RTL usernames), use CSS `unicode-bidi: isolate` instead of inserting Unicode characters:

```css
.handle { unicode-bidi: isolate; }
```

## Edge Cases

- RTL handles: some handles may contain RTL characters — ensure display is still correct after removing bidi markers
- Handle in mentions: same issue may affect @mention copying
- Handle in profile URLs: ensure URL construction strips bidi characters
