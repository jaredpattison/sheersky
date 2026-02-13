# Notification Grouping

**GitHub Issues:** [#5625](https://github.com/bluesky-social/social-app/issues/5625), [#2059](https://github.com/bluesky-social/social-app/issues/2059)
**Category:** Feature — Notifications
**Effort:** Medium
**Scope:** Client-side only

## Problem

Individual notifications are shown separately. When multiple people like the same post, you get N separate "liked your post" notifications instead of one grouped notification. This clutters the notification feed.

## Expected Behavior

- Notifications of the same type for the same post are grouped: "Alice, Bob, and 3 others liked your post"
- Groups are expandable to see individual actors
- Groups are limited by time window (e.g., notifications within 24 hours of each other)
- Types that group: likes, reposts, follows

## Key Files

| File | Purpose |
|------|---------|
| `src/state/queries/notifications/feed.ts` | Notification feed query — fetches paginated notifications. Grouping logic would be added in the `select` callback |
| `src/state/queries/notifications/util.ts` | Notification utility functions |
| `src/state/queries/notifications/types.ts` | Notification type definitions |
| `src/view/com/notifications/NotificationFeed.tsx` | Notification list renderer |
| `src/view/com/notifications/NotificationFeedItem.tsx` | Individual notification item — would need a grouped variant |

## Implementation Approach

### 1. Grouping Logic

In the notification feed query's `select` callback, group notifications by type + subject:

```ts
interface GroupedNotification {
  type: 'like' | 'repost' | 'follow'
  subjectUri?: string           // the post that was liked/reposted
  actors: ProfileViewBasic[]    // all users who performed the action
  indexedAt: string             // most recent timestamp
  isRead: boolean
}

function groupNotifications(items: Notification[]): (Notification | GroupedNotification)[] {
  const groups = new Map<string, GroupedNotification>()

  for (const item of items) {
    if (['like', 'repost'].includes(item.reason)) {
      const key = `${item.reason}:${item.reasonSubject}`
      if (groups.has(key)) {
        groups.get(key)!.actors.push(item.author)
      } else {
        groups.set(key, {
          type: item.reason,
          subjectUri: item.reasonSubject,
          actors: [item.author],
          indexedAt: item.indexedAt,
          isRead: item.isRead,
        })
      }
    }
  }

  // Merge groups back into the timeline at the position of the most recent notification
  // ...
}
```

### 2. Grouped Item Rendering

```tsx
function GroupedNotificationItem({ group }: { group: GroupedNotification }) {
  const displayActors = group.actors.slice(0, 3)
  const remaining = group.actors.length - displayActors.length

  return (
    <View>
      <AvatarStack avatars={displayActors.map(a => a.avatar)} />
      <Text>
        {displayActors.map(a => a.displayName).join(', ')}
        {remaining > 0 && ` and ${remaining} others`}
        {' '}{group.type === 'like' ? 'liked' : 'reposted'} your post
      </Text>
      <PostPreview uri={group.subjectUri} />
    </View>
  )
}
```

## Edge Cases

- Cross-page grouping: notifications on page 2 may belong to a group started on page 1 — handle merging across pages
- Follow grouping: follows don't have a subject URI — group by time window only
- Mixed read/unread: a group is unread if any member is unread
- Expand/collapse: users should be able to expand a group to see all individual actors
- Reply and mention notifications: should NOT be grouped (each has unique content)
- Time window: don't group notifications more than 24h apart for the same subject
