# Hide Engagement Counts

**Category:** Feature — Mental Health / UX
**Effort:** Low
**Scope:** Client-side only

## Problem

Like counts, repost counts, and reply counts on posts create social pressure and influence how people engage with content. Some users prefer to see content without engagement metrics, focusing on the content itself.

## Expected Behavior

- Setting in Preferences: "Hide engagement counts" (toggle, default: off)
- When enabled, like, repost, and reply counts are not displayed on posts
- The action buttons (like, repost, reply) still work — just the numbers are hidden
- Own posts optionally still show counts (sub-toggle: "Show counts on own posts")

## Key Files

| File | Purpose |
|------|---------|
| `src/view/com/post/PostCtrls.tsx` or similar | Post action bar — renders like/repost/reply buttons with counts |
| `src/state/persisted/schema.ts` | Add preference |

## Implementation Approach

### 1. Preference

```ts
// src/state/persisted/schema.ts
hideEngagementCounts: z.boolean().optional().default(false)
```

### 2. Conditional Rendering

In the post controls component:

```tsx
const hideEngagementCounts = useHideEngagementCounts()

// Like button
<Button label="Like" onPress={onLike}>
  <HeartIcon filled={isLiked} />
  {!hideEngagementCounts && likeCount > 0 && (
    <Text>{formatCount(likeCount)}</Text>
  )}
</Button>
```

Apply the same pattern to repost count and reply count.

### 3. Profile Stats

Optionally also hide follower/following counts on profiles, with a separate toggle.

## Edge Cases

- Own posts: users may want to see their own engagement — offer a sub-toggle
- Notification counts: these are different from post engagement and should not be affected
- Thread view: the root post often shows expanded stats — hide these too when enabled
- Post detail view: the full stats section (who liked, who reposted) should still be accessible
