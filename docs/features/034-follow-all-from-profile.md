# Follow All From User's Following List

**Category:** Feature — Discovery / Social Graph
**Effort:** Low-Medium
**Scope:** Client-side only (uses existing AT Protocol follow API)

## Problem

When you discover a power user or curator with great taste, you may want to follow everyone they follow. Currently you'd have to tap "Follow" on each user individually — impractical for lists of hundreds or thousands.

## Expected Behavior

- On a user's "Following" page, a "Follow All" button in the header
- Tapping it shows a confirmation with the count: "Follow 1,200 accounts?"
- Operation runs in the background — user can navigate away
- A persistent toast/banner shows progress: "Following... 342/1,200"
- Skips accounts you already follow
- Individual follow buttons remain for one-at-a-time use (existing behavior)

## Existing Infrastructure

The codebase already has bulk follow functionality for starter packs. We reuse this directly.

### `bulkWriteFollows()` — `src/screens/Onboarding/util.ts`

Core utility that batches follows via `com.atproto.repo.applyWrites`:
- Chunks into groups of 50 (ATProto `applyWrites` limit)
- Uses `TID.nextStr()` to generate rkeys
- Waits for indexing with retry (5 attempts, 1s delay)
- Returns `Map<string, string>` of DID → follow URI for cache updates

### Starter Pack "Follow All" — `src/screens/StarterPack/StarterPackScreen.tsx`

The starter pack screen (lines 346-397) already has a complete "Follow All" flow:
1. Fetches all list members via `getAllListMembers()` (paginated, capped at 6 pages / 300 users)
2. Filters out: current user, blocked/blocking, muted, already-following
3. Calls `bulkWriteFollows(agent, dids)`
4. Updates profile shadow cache via `batchedUpdates()` + `updateProfileShadow()`
5. Shows toast + logs analytics

### `getAllListMembers()` — `src/state/queries/list-members.ts`

Paginated fetcher capped at 6 pages (300 users). **Not suitable for our use case** — a user's following list can be 1,200+. We need an uncapped follows fetcher.

## Key Files

| File | Purpose |
|------|---------|
| `src/screens/Onboarding/util.ts` | `bulkWriteFollows()` — reuse directly |
| `src/screens/StarterPack/StarterPackScreen.tsx` | Existing "Follow All" pattern — lines 346-453 |
| `src/state/queries/list-members.ts` | `getAllListMembers()` — pattern for paginated fetching |
| `src/state/queries/profile.ts` | `updateProfileShadow()` for cache updates (line 374+) |
| `src/screens/Profile/Follows.tsx` or similar | Following list screen — add button here |

## Implementation Approach

### 1. Fetch All Follows (Uncapped)

Unlike `getAllListMembers()` which caps at 6 pages, we need all follows:

```ts
async function fetchAllFollows(
  agent: BskyAgent,
  did: string,
  onPageFetched?: (soFar: number) => void,
): Promise<AppBskyActorDefs.ProfileView[]> {
  const follows: AppBskyActorDefs.ProfileView[] = []
  let cursor: string | undefined

  do {
    const res = await agent.app.bsky.graph.getFollows({
      actor: did,
      limit: 100,
      cursor,
    })
    follows.push(...res.data.follows)
    cursor = res.data.cursor
    onPageFetched?.(follows.length)
  } while (cursor)

  return follows
}
```

### 2. Background Task Context

The starter pack implementation blocks the UI (spinner on the button, user stays on page). For large lists we need a background approach — a React context at the shell level:

```ts
// src/state/bulk-follow.tsx
interface BulkFollowState {
  active: boolean
  targetHandle: string
  done: number        // chunks completed × 50
  total: number       // total DIDs to follow
  cancelled: boolean
}

const BulkFollowContext = React.createContext<{
  state: BulkFollowState | null
  start: (did: string, handle: string) => void
  cancel: () => void
}>()
```

The provider wraps the app shell, calls `bulkWriteFollows()` in chunks, and updates state on each chunk completion. The `cancel` ref is checked between chunks.

### 3. Wire Up to Following Page

Add a "Follow All" button to the Following list header, matching the starter pack button style:

```tsx
// Following list screen header
<Button
  label={_(msg`Follow all`)}
  variant="solid"
  color="primary"
  size="small"
  disabled={bulkFollowState?.active}
  onPress={() => confirmDialog.open()}
>
  <ButtonText><Trans>Follow all</Trans></ButtonText>
</Button>
```

### 4. Confirmation Dialog

```tsx
<Dialog.ScrollableInner label={_(msg`Follow All`)}>
  <Dialog.Header>
    <Dialog.HeaderText><Trans>Follow All</Trans></Dialog.HeaderText>
  </Dialog.Header>
  <Text>
    <Trans>Follow all {count} accounts that @{handle} follows?
    Already-followed accounts will be skipped. This runs in the background.</Trans>
  </Text>
  <Button label="Follow All" onPress={handleConfirm} color="primary" size="large">
    <ButtonText><Trans>Follow All</Trans></ButtonText>
  </Button>
</Dialog.ScrollableInner>
```

### 5. Persistent Progress Toast

Rendered at the shell level, visible on all screens:

```tsx
function BulkFollowToast() {
  const { state, cancel } = useBulkFollow()
  if (!state?.active) return null

  return (
    <View style={styles.toast}>
      <Text>
        <Trans>Following @{state.targetHandle}... {state.done}/{state.total}</Trans>
      </Text>
      <Button label="Cancel" onPress={cancel} size="tiny" color="secondary">
        <ButtonText><Trans>Cancel</Trans></ButtonText>
      </Button>
    </View>
  )
}
```

### 6. Cache Updates

Same pattern as starter packs — after each chunk, update profile shadows:

```ts
batchedUpdates(() => {
  for (const did of chunkDids) {
    updateProfileShadow(queryClient, did, {
      followingUri: followUris.get(did),
    })
  }
})
```

This ensures follow buttons in the Following list update in real-time as the background operation progresses.

## Differences From Starter Pack Implementation

| Aspect | Starter Pack | Follow All (ours) |
|--------|-------------|-------------------|
| Source | List members (`getList`) | User's follows (`getFollows`) |
| Page cap | 6 pages (~300 users) | Uncapped (1,200+) |
| UI blocking | Spinner on button, stays on page | Background with persistent toast |
| Cancellation | Not supported | Supported via cancel button |
| Progress | None (just spinner) | Chunk-level progress (done/total) |

## Edge Cases

- Very large lists (5000+): fetching all follows pages takes time — show "Fetching list..." before the confirmation count
- Already following: skip silently via filter (same as starter packs), report in summary
- Blocked/muted accounts: skip (same filter as starter packs)
- Network errors mid-operation: retry failed chunks, track last successful chunk for resume
- App backgrounded (native): operation pauses when app is suspended — resume on foreground
- Completion: show summary toast ("Followed 847 new accounts") and clear the progress banner
- Concurrent operations: disable the "Follow All" button if a bulk follow is already running
- Cache consistency: `updateProfileShadow()` per chunk keeps UI in sync as each batch completes
- Undo: consider offering "Undo bulk follow" that unfollows all accounts followed in the batch
