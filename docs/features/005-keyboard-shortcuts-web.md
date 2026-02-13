# Keyboard Shortcuts (Web)

**GitHub Issue:** [#640](https://github.com/bluesky-social/social-app/issues/640)
**Upvotes:** 67
**Category:** Feature — Web UX / Power Users
**Effort:** Medium
**Scope:** Client-side only (web)

## Problem

The web app has no keyboard shortcuts for common actions. Power users coming from Twitter/X expect j/k navigation, keyboard shortcuts for like/reply/repost, and quick access to compose.

## Expected Behavior

### Global Shortcuts
| Key | Action |
|-----|--------|
| `n` | Open new post composer |
| `/` | Focus search bar |
| `g h` | Go to Home |
| `g n` | Go to Notifications |
| `g s` | Go to Search |
| `g p` | Go to Profile |
| `?` | Show shortcut help dialog |

### Feed Navigation
| Key | Action |
|-----|--------|
| `j` | Move focus to next post |
| `k` | Move focus to previous post |
| `Enter` or `o` | Open focused post thread |
| `.` | Load new posts |

### Post Actions (when a post is focused)
| Key | Action |
|-----|--------|
| `l` | Like/unlike |
| `t` | Repost |
| `r` | Reply |
| `s` | Share |

## Key Files

| File | Purpose |
|------|---------|
| `src/view/shell/index.web.tsx` | Web shell — top-level layout, ideal place for global key listener |
| `src/view/com/lightbox/Lightbox.web.tsx` | Already has keyboard handling (Escape, arrow keys) for lightbox — pattern to follow |
| `src/view/com/posts/PostFeed.tsx` | Feed list — needs per-item focus tracking |
| `src/view/com/post/Post.tsx` | Individual post component — needs focus ring styling and action dispatch |
| `src/Navigation.tsx` | Navigation config — for `g + key` navigation shortcuts |

## Implementation Approach

### 1. Shortcut Manager

Create a web-only keyboard shortcut manager:

```ts
// src/lib/shortcuts/index.web.ts
// Registers global keydown listener on document
// Ignores shortcuts when focus is in text inputs/textareas
// Supports single keys and two-key sequences (g+h)
// Emits events via EventEmitter or React context
```

### 2. Focus Tracking for Feed

Track which post is "focused" (highlighted) via a React context:

```ts
// src/state/feed-focus.tsx
const FeedFocusContext = React.createContext({
  focusedIndex: -1,       // -1 = no focus
  setFocusedIndex: () => {},
  focusedPostUri: null,
})
```

When j/k is pressed:
1. Increment/decrement focused index
2. Scroll the focused post into view
3. Apply a visible focus ring/highlight style to the focused post

### 3. Post Action Dispatch

When a post is focused and an action key is pressed:

```ts
// In the shortcut handler
if (key === 'l' && focusedPostUri) {
  // Trigger like mutation for focusedPostUri
}
if (key === 'r' && focusedPostUri) {
  // Open reply composer for focusedPostUri
}
```

### 4. Input Guard

Don't fire shortcuts when the user is typing:

```ts
const isTyping = () => {
  const el = document.activeElement
  return el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' ||
         el?.getAttribute('contenteditable') === 'true'
}
```

## Edge Cases

- Composer open: all shortcuts should be disabled when the compose dialog is open
- Dialog open: shortcuts should be disabled when any dialog/modal is open
- Search focused: `/` shouldn't re-focus search if already focused
- Two-key sequences: need a timeout (e.g., 500ms) for the second key
- Accessibility: shortcuts must not conflict with screen reader key bindings
- Help dialog: `?` should show a modal listing all available shortcuts
