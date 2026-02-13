# Fine-Grained Muting Options

**GitHub Issue:** [#6330](https://github.com/bluesky-social/social-app/issues/6330)
**Upvotes:** 34
**Category:** Feature — Moderation / Content Filtering
**Effort:** Medium
**Scope:** Client-side only

## Problem

The current mute system is all-or-nothing: you mute a user entirely or not at all. Users want more granular control — timed mutes, mute-reposts-only, mute specific conversations.

## Expected Behavior

### Timed Mutes
- When muting a user, option to choose duration: 24 hours, 7 days, 30 days, Forever
- Expired mutes are automatically removed

### Mute Reposts Only
- Mute only reposts from a user while still seeing their original posts
- (Overlaps with [#1116 Hide Reposts Per Account](001-hide-reposts-per-account.md))

### Mute Thread / Conversation
- Mute a specific thread to stop seeing replies in notifications and feed
- Useful for threads that blow up and fill your notifications

## Key Files

| File | Purpose |
|------|---------|
| `src/components/dialogs/MutedWords.tsx` | Existing muted words dialog — already supports durations (24h, 7d, 30d, Forever). Pattern to follow |
| `src/state/queries/preferences/index.ts` | Preferences query — muted words are at `preferences.moderationPrefs.mutedWords` with `expiresAt` field |
| `src/state/persisted/schema.ts` | Local persisted prefs — timed user mutes would need local storage since the API may not support expiration on user mutes |

## Implementation Approach

### Timed User Mutes

The AT Protocol `app.bsky.graph.mute` record doesn't support expiration. Implement locally:

```ts
// src/state/persisted/schema.ts
timedMutes: z.array(z.object({
  did: z.string(),
  expiresAt: z.string(),  // ISO date
})).optional().default([])
```

On app startup and periodically, clean up expired mutes by calling `agent.unmute()` for each expired entry.

### Mute Thread

Store muted thread URIs locally:

```ts
mutedThreadUris: z.array(z.string()).optional().default([])
```

Filter notifications and feed replies matching muted root URIs.

### UI

Add duration picker to the existing mute confirmation dialog. Reuse the duration UI pattern from the Muted Words dialog (lines 76-82 of `MutedWords.tsx`).

## Edge Cases

- Server-side mute vs local timed mute: need to keep them in sync — mute via API, then unmute via API when time expires
- App not running when mute expires: clean up on next launch
- Muted thread replies: filter in both the notification feed and the Following feed
- Thread mute scope: only the specific thread root URI, not all posts by the participants
