# Feed Position Memory / Don't Auto-Scroll

**GitHub Issues:** [#976](https://github.com/bluesky-social/social-app/issues/976) (452 upvotes), [#4107](https://github.com/bluesky-social/social-app/issues/4107) (76 upvotes)
**Category:** Feature — Feed UX
**Effort:** Medium
**Scope:** Client-side only

## Problem

When users tap "Load New" or return to the app, the feed jumps to the top. Users lose their reading position and have to scroll back down to find where they left off. This is the single most upvoted UX complaint.

## Expected Behavior

- Tapping "Load New" inserts new posts above the current viewport without shifting scroll position
- Switching between feed tabs preserves scroll position (already partially works on web via `Pager.web.tsx`)
- Returning to the app after backgrounding restores approximate position
- Optional: persist last-read cursor across sessions

## Key Files

| File | Purpose |
|------|---------|
| `src/view/com/feeds/FeedPage.tsx` | Feed page container — `onPressLoadLatest()` at line 129 calls `scrollToTop()` then `truncateAndInvalidate()` — this is the core problem |
| `src/view/com/posts/PostFeed.tsx` | Feed list renderer — wraps `List` component with `scrollElRef` |
| `src/state/queries/post-feed.ts` | Feed data query — `truncateAndInvalidate()` resets to page 1, `pollLatest()` checks for new posts |
| `src/view/com/util/List.tsx` / `List.web.tsx` | Low-level list component — `scrollToOffset()`, `scrollToTop()` methods |
| `src/view/com/pager/Pager.web.tsx` | Web tab pager — already saves/restores `scrollYs` per tab (lines 41-81) |
| `src/view/screens/Home.tsx` | Home screen — manages feed tabs and pager |
| `src/state/events.ts` | Soft reset event — triggers scroll-to-top on Home tab double-tap |

## Current Behavior (Why It Jumps)

```
User taps "Load New"
  → FeedPage.onPressLoadLatest()
    → scrollToTop()                    ← scrolls to offset -headerOffset
    → truncateAndInvalidate()          ← resets query to page 1
    → setHasNew(false)                 ← hides button
```

The `truncateAndInvalidate()` call discards all cached pages and refetches from page 1, which means the old items below the viewport are gone.

## Implementation Approach

### Option A: Insert-Above (Preferred)

Instead of truncating and refetching, prepend new posts to the existing data:

1. When "Load New" is pressed, fetch new posts since the newest cached post
2. Insert them at the top of the existing data array
3. On web: adjust `scrollTop` by the height of inserted content to keep viewport stable
4. On native: use `maintainVisibleContentPosition` prop on FlatList (React Native supports this)

```ts
// FeedPage.tsx — modified onPressLoadLatest
const onPressLoadLatest = () => {
  // DON'T scroll to top
  // DON'T truncate
  // Instead, refetch page 1 and merge with existing data
  queryClient.refetchQueries({queryKey: FEED_RQKEY(feed), pages: 1})
  setHasNew(false)
}
```

The `select` callback in `post-feed.ts` would need to handle merging new page-1 data with existing pages without duplicates.

### Option B: Scroll Position Save/Restore (Simpler)

1. Before `truncateAndInvalidate()`, save the URI of the topmost visible post
2. After refetch completes, find that post in the new data and scroll to it
3. If the post is no longer in the first page, fall back to top

```ts
// Save position
const topVisiblePostUri = getTopVisiblePost(scrollElRef)

// Refetch
await truncateAndInvalidate(queryClient, feedKey)

// Restore
scrollToPostUri(topVisiblePostUri)
```

### Key Constants

| Constant | Value | Location |
|----------|-------|----------|
| `SCROLLED_DOWN_LIMIT` | 200px | `List.tsx:45` |
| `CHECK_LATEST_AFTER` | 30s | `PostFeed.tsx:188` |
| `POLL_FREQ` | 60s | `FeedPage.tsx:43` |
| `MIN_POSTS` | 30 | `post-feed.ts:133` |

## Edge Cases

- Very long time away: hundreds of new posts — may need to cap prepended posts and show a "gap" indicator
- Memory pressure: too many cached items — implement a sliding window that drops items far below viewport
- Native `maintainVisibleContentPosition`: may have performance implications on older devices
- Double-tap Home tab: should still scroll to top (soft reset behavior is intentional there)
- Multiple feed tabs: each tab needs independent position tracking
