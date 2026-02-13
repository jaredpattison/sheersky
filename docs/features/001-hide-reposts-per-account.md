# Hide Reposts Per Account

**GitHub Issue:** [#1116](https://github.com/bluesky-social/social-app/issues/1116)
**Upvotes:** 391
**Category:** Feature — Feed Filtering
**Effort:** Low-Medium
**Scope:** Client-side only

## Problem

Users want to hide reposts (and optionally quote posts) from specific followed accounts without unfollowing them. Some users post great original content but repost excessively, cluttering the feed.

## Expected Behavior

- On a user's profile, a new option: "Hide reposts from this user"
- When enabled, reposts by that user are filtered out of the Following feed
- Quote posts can optionally be included in the filter
- The setting persists across sessions
- The user can see and manage all "hidden repost" accounts in Settings

## Key Files

| File | Purpose |
|------|---------|
| `src/state/queries/post-feed.ts` | Feed data fetching + filtering pipeline. Reposts have `reason.$type === 'app.bsky.feed.defs#reasonRepost'` with `reason.by.did` identifying the reposter |
| `src/state/queries/post-feed.ts` → `FeedTuner` | Applies feed-level filters (deduplication, follows-only, etc.) — new filter would plug in here |
| `src/state/persisted/schema.ts` | Persisted preferences schema — add `hiddenRepostDids: string[]` |
| `src/state/persisted/store.ts` | Persisted storage read/write |
| `src/screens/Profile/Header/ProfileHeaderStandard.tsx` | Profile header — add menu option here |
| `src/components/ProfileHeaderMenu.tsx` | Profile overflow menu (mute, block, etc.) — add "Hide reposts" option alongside existing actions |

## Implementation Approach

### 1. Persisted Preference

Add a new persisted key `hiddenRepostDids` (array of DID strings) to the persisted schema:

```ts
// src/state/persisted/schema.ts
hiddenRepostDids: z.array(z.string()).optional().default([])
```

Create a React context provider + hooks:

```ts
// src/state/preferences/hidden-reposts.tsx
useHiddenRepostDids(): string[]
useSetHiddenRepostDids(): (dids: string[]) => void
useIsRepostHidden(did: string): boolean
useToggleHiddenReposts(did: string): () => void
```

### 2. Feed Filtering

In `post-feed.ts`, the feed items go through a `select` callback that applies `FeedTuner` filters. Add a new tuner step that checks:

```ts
if (
  item.reason?.$type === 'app.bsky.feed.defs#reasonRepost' &&
  hiddenRepostDids.includes(item.reason.by.did)
) {
  // Filter out this item
}
```

This should be applied in the tuner chain alongside existing filters like `dedupReposts`, `followedOnly`, etc.

### 3. Profile Menu Option

Add a menu item in `ProfileHeaderMenu.tsx` alongside "Mute Account" and "Block Account":

```tsx
<Menu.Item
  label={isRepostHidden ? "Show reposts" : "Hide reposts"}
  onPress={() => toggleHiddenReposts(profile.did)}
>
  <Menu.ItemIcon icon={isRepostHidden ? Eye : EyeSlash} />
  <Menu.ItemText>
    {isRepostHidden
      ? <Trans>Show reposts</Trans>
      : <Trans>Hide reposts from this user</Trans>}
  </Menu.ItemText>
</Menu.Item>
```

### 4. Settings Management

Add a section in Settings (or under Moderation settings) listing all accounts with hidden reposts, with an option to remove each one. Pattern after the existing Muted Words dialog.

## Edge Cases

- Repost of a repost: filter by the immediate reposter's DID
- Quote posts: may warrant a separate toggle since they contain original commentary
- Feed types: only apply to Following feed, not to custom feeds or profile feeds
- Feed invalidation: toggling the preference should invalidate the Following feed query so filtered items disappear immediately
