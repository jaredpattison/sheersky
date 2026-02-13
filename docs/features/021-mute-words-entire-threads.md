# Mute Words Should Mute Entire Threads

**GitHub Issue:** [#9392](https://github.com/bluesky-social/social-app/issues/9392)
**Upvotes:** 2
**Category:** Bug Fix — Moderation
**Effort:** Low-Medium
**Scope:** Client-side only

## Problem

When a mute word matches a post in a thread, only that specific post is hidden. Other posts in the same thread (parent/replies) still appear in the feed, which partially defeats the purpose of muting a topic.

## Expected Behavior

- When a mute word matches any post in a thread chain, the entire thread appearance in the feed is hidden
- This applies to: the matched post, its parent context shown in feed, and "replied to" context
- In the thread detail view, individual muted posts should still be collapsible (not the entire thread)

## Key Files

| File | Purpose |
|------|---------|
| `src/state/queries/post-feed.ts` | Feed filtering — mute word moderation is applied per-post via `moderatePost()`. Thread-level muting would need to check parent/root posts too |
| `@atproto/api` moderation | `moderatePost()` checks mute words against individual posts |

## Implementation Approach

In the feed select callback, when a post has a reply parent or root:

```ts
// After moderating the current post, also check parent/root for mute words
const rootPost = feedItem.reply?.root
const parentPost = feedItem.reply?.parent

if (rootPost) {
  const rootMod = moderatePost(rootPost, moderationOpts)
  if (rootMod.content.filter) {
    // Mute word hit on root — hide this feed item
  }
}

if (parentPost && parentPost !== rootPost) {
  const parentMod = moderatePost(parentPost, moderationOpts)
  if (parentMod.content.filter) {
    // Mute word hit on parent — hide this feed item
  }
}
```

## Edge Cases

- Performance: moderating multiple posts per feed item adds overhead — only check when the item has reply context
- Thread detail view: don't hide the entire thread, just individual muted posts (different context than feed)
- Partial thread in feed: feed shows "X replied to Y" — if Y is muted, hide the entire card
- Deep threads: only check immediate parent and root, not all ancestors
