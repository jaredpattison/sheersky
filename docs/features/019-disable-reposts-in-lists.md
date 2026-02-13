# Disable Reposts/Quote Posts in List Views

**GitHub Issue:** [#9721](https://github.com/bluesky-social/social-app/issues/9721)
**Upvotes:** 9
**Category:** Feature — Lists / Feed Filtering
**Effort:** Low
**Scope:** Client-side only

## Problem

When viewing a user list as a feed, it shows reposts and quote posts from list members. Users want to see only original content when browsing lists.

## Expected Behavior

- Toggle on list feed views: "Hide reposts" / "Show original posts only"
- When enabled, items with `reason.$type === 'app.bsky.feed.defs#reasonRepost'` are filtered out
- Optionally also filter quote posts (posts that embed another post as a quote)
- Setting persists per-list or as a global list-view preference

## Key Files

| File | Purpose |
|------|---------|
| `src/state/queries/post-feed.ts` | Feed query — list feeds use `FeedDescriptor` with list URI. Repost filtering would be added to the `FeedTuner` chain |
| `src/screens/Profile/Sections/Feed.tsx` | List feed section — rendering component |

## Implementation Approach

Add a tuner filter that strips reposts from list feeds:

```ts
// In FeedTuner or select callback for list feeds
if (hideRepostsInLists && feedDescriptor.startsWith('list|')) {
  items = items.filter(item =>
    item.reason?.$type !== 'app.bsky.feed.defs#reasonRepost'
  )
}
```

### UI

Add a filter toggle at the top of the list feed view, or in the list settings menu.

## Edge Cases

- Quote posts: distinguish from reposts — quotes contain original commentary and may be worth keeping
- List feed vs list members: this applies to the feed view, not the members list
- Consistency with hide-reposts-per-account: these features are complementary but independent
