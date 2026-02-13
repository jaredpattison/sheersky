# Swipe Actions on Posts

**Category:** Feature — Mobile UX
**Effort:** Medium
**Scope:** Client-side only (native)

## Problem

On mobile, performing actions on posts requires tapping small buttons. Swipe gestures for common actions (like, reply, repost) would be faster and more ergonomic.

## Expected Behavior

- Swipe right on a post to like it (short swipe) or repost (long swipe)
- Swipe left to reply (short swipe) or share (long swipe)
- Visual feedback: colored background reveals behind the post as you swipe
- Haptic feedback on threshold crossings
- Customizable: users choose which actions map to which gestures

## Key Files

| File | Purpose |
|------|---------|
| `src/view/com/posts/PostFeed.tsx` | Feed list — wraps each post item |
| `src/view/com/post/Post.tsx` | Individual post component — wrap with swipeable |
| `react-native-gesture-handler` | Already in the project — provides `Swipeable` component |

## Implementation Approach

### 1. Swipeable Wrapper

Wrap each feed post item in a `Swipeable` from react-native-gesture-handler:

```tsx
import { Swipeable } from 'react-native-gesture-handler'

function SwipeablePost({ post, children }) {
  const renderLeftActions = (progress, dragX) => (
    <View style={[styles.swipeAction, { backgroundColor: colors.like }]}>
      <HeartIcon />
    </View>
  )

  const renderRightActions = (progress, dragX) => (
    <View style={[styles.swipeAction, { backgroundColor: colors.reply }]}>
      <ReplyIcon />
    </View>
  )

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableLeftOpen={() => handleLike(post)}
      onSwipeableRightOpen={() => handleReply(post)}
    >
      {children}
    </Swipeable>
  )
}
```

### 2. Preference

```ts
// src/state/persisted/schema.ts
swipeActionsEnabled: z.boolean().optional().default(false)  // opt-in to avoid surprising users
```

### 3. Customization

Allow users to map actions to swipe directions in Settings > Gestures.

## Edge Cases

- Horizontal scroll conflict: image carousels and quote post swipe may conflict — disable swipe actions when interacting with horizontally scrollable content
- Accessibility: swipe actions must not be the only way to perform actions — buttons remain available
- Web: not applicable — web doesn't have native swipe gestures (could map to hover actions instead)
- Thread view: swipe actions should also work in thread detail view
- Performance: `Swipeable` adds gesture overhead — benchmark with large feeds
