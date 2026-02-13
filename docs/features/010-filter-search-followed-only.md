# Filter Search Results to Followed Users Only

**GitHub Issue:** [#6481](https://github.com/bluesky-social/social-app/issues/6481)
**Upvotes:** 38
**Category:** Feature — Search
**Effort:** Low-Medium
**Scope:** Client-side only

## Problem

When searching for posts, users often want to see results only from people they follow, not from the entire network. Currently there's no way to scope search results.

## Expected Behavior

- A toggle or filter chip on the search results screen: "From followed only"
- When enabled, post search results are filtered to only show posts from accounts the user follows
- User/profile search results could also be filtered to show only followed accounts first

## Key Files

| File | Purpose |
|------|---------|
| `src/screens/Search/SearchResults.tsx` | Search results screen — `SearchScreenPostResults` component renders post results |
| `src/state/queries/search-posts.ts` | Post search query — currently applies moderation but no follow-based filtering |
| `src/state/queries/my-follows.ts` | Likely contains the user's follow list for lookup |

## Implementation Approach

### Option A: Client-Side Filter

Filter search results after fetching by checking if `post.author.did` is in the user's follow set:

```ts
const { data: follows } = useMyFollowsQuery()
const followDids = new Set(follows?.map(f => f.did))

// In search results rendering
const filteredResults = followedOnly
  ? results.filter(item => followDids.has(item.post.author.did))
  : results
```

### Option B: Search Operator

The Bluesky search API may support a `from:` operator. Build a compound query:

```ts
// Prepend "from:me" or use following-scoped search if the API supports it
const scopedQuery = followedOnly ? `${query} network:following` : query
```

### UI

Add a filter chip row above search results:

```tsx
<View style={[a.flex_row, a.gap_sm, a.px_md]}>
  <FilterChip
    label="From followed"
    active={followedOnly}
    onPress={() => setFollowedOnly(!followedOnly)}
  />
</View>
```

## Edge Cases

- Large follow lists: building a Set of followed DIDs for client-side filtering could be memory-intensive for users following thousands of accounts
- Pagination: client-side filtering reduces visible results per page — may need to fetch more pages
- Empty results: show "No results from people you follow" with option to expand search
- The `from:` search operator approach is more efficient but depends on API support
