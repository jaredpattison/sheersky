# Muted Users Show in Search Results

**GitHub Issue:** [#3234](https://github.com/bluesky-social/social-app/issues/3234)
**Upvotes:** 11
**Category:** Bug Fix — Search / Moderation
**Effort:** Low
**Scope:** Client-side only

## Problem

Muted users still appear in user/profile search results. Post search results are moderated (via `moderatePost()`), but the user search results in `SearchScreenUserResults` have NO moderation filtering applied.

## Expected Behavior

- Muted accounts are hidden from user search results
- Blocked accounts are hidden from user search results
- Post search already works correctly — just user search is missing the filter

## Key Files

| File | Purpose |
|------|---------|
| `src/screens/Search/SearchResults.tsx` | `SearchScreenUserResults` component (lines 369-446) — renders `<ProfileCardWithFollowBtn>` for each result with NO moderation check |
| `src/state/queries/search-posts.ts` | Post search query — correctly applies `moderatePost()` in select callback (lines 76-143). Pattern to follow |

## Implementation Approach

Apply `moderateProfile()` to user search results before rendering:

```tsx
// In SearchScreenUserResults
const moderationOpts = useModerationOpts()

const filteredResults = results.filter(profile => {
  if (!moderationOpts) return true
  const moderation = moderateProfile(profile, moderationOpts)
  // Hide if account-level moderation says to filter
  return !moderation.account.filter
})
```

## Edge Cases

- Blocked-by users: should also be filtered (users who blocked you)
- Labeler-hidden users: respect labeler moderation on profiles
- "No results" state: if all results are filtered, show appropriate empty state
