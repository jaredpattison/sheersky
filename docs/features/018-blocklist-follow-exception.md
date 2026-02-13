# Blocklists Should Not Block Users You Follow

**GitHub Issue:** [#6464](https://github.com/bluesky-social/social-app/issues/6464)
**Upvotes:** 11
**Category:** Bug Fix — Moderation
**Effort:** Low
**Scope:** Client-side only

## Problem

When subscribing to a moderation blocklist (mute list), it can block users you already follow. This is surprising and unwanted — if you follow someone, you've explicitly chosen to see their content regardless of what lists they appear on.

## Expected Behavior

- Users you follow are exempt from blocklist-based blocking/muting
- Their content remains visible even if they're on a subscribed blocklist
- The exemption only applies to follows, not to other relationships

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/moderation/soft-block.ts` | SheerSky's existing moderation cause filtering — `filterBlockedByCauses()` already strips causes. Can add follow-based exemption here |
| `src/state/queries/post-feed.ts` | Feed filtering pipeline — moderation is applied in the select callback |

## Implementation Approach

When evaluating moderation causes from list-based blocks, check if the target user is someone the current user follows:

```ts
// In moderation filtering
if (
  cause.type === 'muted' &&
  cause.source?.type === 'list' &&
  post.author.viewer?.following
) {
  // Skip this moderation cause — user follows this author
  continue
}
```

This check integrates naturally with the existing moderation pipeline. The `viewer.following` field is already present on post author objects in the feed response.

## Edge Cases

- Direct blocks vs list blocks: only exempt for list-sourced blocks, not direct user blocks
- Mute lists vs block lists: apply exemption to both types
- Profile moderation: the exemption should apply when viewing profiles too, not just feed items
- Unfollowing: if the user unfollows, the blocklist should take effect again immediately
