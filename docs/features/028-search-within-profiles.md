# Search Within User Profiles

**Category:** Feature — Search / Profiles
**Effort:** Low-Medium
**Scope:** Client-side only

## Problem

Users want to find specific posts by a particular user. Currently there's no search bar on profile pages. The global search supports `from:handle` but most users don't know this.

## Expected Behavior

- A search icon/bar on the profile page's posts tab
- Typing a query searches only that user's posts
- Results replace the profile feed temporarily
- Clearing the search returns to the normal profile feed

## Key Files

| File | Purpose |
|------|---------|
| `src/screens/Profile/` | Profile screen components |
| `src/screens/Profile/Sections/Feed.tsx` | Profile feed section |
| `src/state/queries/search-posts.ts` | Search posts query — supports `from:handle` operator |

## Implementation Approach

### 1. Search Bar

Add a search input to the profile posts tab header:

```tsx
const [searchQuery, setSearchQuery] = useState('')
const isSearching = searchQuery.length > 0

// Build scoped query
const scopedQuery = `from:${profile.handle} ${searchQuery}`
```

### 2. Conditional Feed

When searching, swap the profile feed for search results:

```tsx
{isSearching ? (
  <SearchPostResults query={scopedQuery} />
) : (
  <ProfileFeed did={profile.did} />
)}
```

### 3. UI

- Search icon in the profile tab bar that expands into an input
- "X" button to clear search and return to normal feed
- Debounce search input (300ms) to avoid excessive API calls

## Edge Cases

- Handles with dots: `from:user.bsky.social query` should work with the search API
- Custom domains: `from:user.example.com` — test with various handle formats
- Empty results: show "No posts found" with suggestion to broaden search
- Search during profile scroll: preserve scroll position when entering/exiting search mode
- Profile media/likes tabs: search could also scope to media-only or liked posts
