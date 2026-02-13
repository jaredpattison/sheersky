# Feed Stops Responding to Taps

**GitHub Issue:** [#7508](https://github.com/bluesky-social/social-app/issues/7508)
**Category:** Bug Fix — Feed UX (Native)
**Effort:** Low-Medium
**Scope:** Client-side only

## Problem

After scrolling through the feed, it sometimes stops responding to tap interactions. Users have to scroll slightly or switch tabs to restore interactivity. This is a React Native gesture handler issue.

## Expected Behavior

- Taps on posts, buttons, and links always register regardless of scroll state
- No dead zones or unresponsive periods after scrolling

## Key Files

| File | Purpose |
|------|---------|
| `src/view/com/util/List.tsx` | List component wrapping FlatList — scroll event handling |
| `src/view/com/posts/PostFeed.tsx` | Feed list component |

## Implementation Approach

### 1. Investigate Root Cause

Common causes of this React Native bug:
- Gesture handler state getting stuck after scroll momentum ends
- `ScrollView` capturing touches and not releasing them
- `pointerEvents` getting set incorrectly during scroll animations
- Reanimated scroll handler interfering with touch events

### 2. Potential Fixes

**Option A:** Add `cancelsTouchesInView={false}` to gesture handlers

**Option B:** Ensure `activeOffsetX`/`activeOffsetY` thresholds are set on scroll gesture to prevent it from capturing taps

**Option C:** Reset gesture handler state when scroll momentum ends:
```ts
onMomentumScrollEnd={() => {
  // Force re-enable touch handling
}}
```

**Option D:** Check for React Native version-specific fixes — this is a known FlatList issue in certain RN versions

### 3. Testing

Reproduce by:
1. Rapidly scrolling through a long feed
2. Stopping scroll with a tap (momentum cancel)
3. Attempting to tap a button immediately

## Edge Cases

- Specific to native (iOS and/or Android) — web is unaffected
- May be related to `react-native-gesture-handler` version
- May be exacerbated by Reanimated animated scroll handler
- Different behavior on older vs newer devices
