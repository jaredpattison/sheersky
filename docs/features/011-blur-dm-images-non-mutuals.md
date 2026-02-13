# Blur DM Images from Non-Mutuals

**GitHub Issue:** [#6711](https://github.com/bluesky-social/social-app/issues/6711)
**Upvotes:** 34
**Category:** Feature — Safety / DMs
**Effort:** Low
**Scope:** Client-side only

## Problem

Users can receive DMs containing images from accounts they don't follow. These images display without any warning, which is a safety concern (unsolicited explicit content).

## Expected Behavior

- Images in DM conversations from non-mutual accounts are blurred by default
- A "Tap to reveal" overlay shows on blurred images
- Tapping reveals the image for the rest of the conversation session
- Mutual follows (both parties follow each other) show images normally
- Option in Settings to disable this behavior

## Key Files

| File | Purpose |
|------|---------|
| `src/screens/Messages/` | DM screens and conversation view |
| `src/state/queries/messages/` | DM data fetching |

## Implementation Approach

### 1. Mutual Follow Detection

When rendering a DM conversation, check if the other participant is a mutual follow:

```ts
const isMutual = otherUser.viewer?.following && otherUser.viewer?.followedBy
```

### 2. Image Blurring

When rendering image embeds in DM messages from non-mutual senders:

```tsx
{!isMutual && !revealed ? (
  <Pressable onPress={() => setRevealed(true)}>
    <Image source={imageUri} style={styles.blurred} blurRadius={20} />
    <View style={styles.overlay}>
      <Text><Trans>Tap to reveal image</Trans></Text>
    </View>
  </Pressable>
) : (
  <Image source={imageUri} />
)}
```

### 3. Preference

```ts
// src/state/persisted/schema.ts
blurDmImagesFromNonMutuals: z.boolean().optional().default(true)
```

## Edge Cases

- Group DMs (future): blur images from any non-mutual member
- GIFs/videos: apply the same blur treatment
- Link preview images: may also warrant blurring
- Reveal persistence: once revealed in a session, stay revealed until app restart (or per-conversation)
