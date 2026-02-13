# Hide Posts Missing Alt Text

**GitHub Issue:** [#4550](https://github.com/bluesky-social/social-app/issues/4550)
**Upvotes:** 79
**Category:** Feature — Accessibility / Feed Filtering
**Effort:** Low
**Scope:** Client-side only

## Problem

Users who rely on screen readers or who value accessibility want to filter out posts containing images that lack alt text. Currently there is no way to hide these posts.

## Expected Behavior

- A toggle in Settings > Accessibility (or Content Filtering): "Hide posts with images missing alt text"
- When enabled, posts containing `app.bsky.embed.images` where any image has an empty `alt` field are hidden from feeds
- Posts with all images having alt text are shown normally
- Posts without images are unaffected

## Key Files

| File | Purpose |
|------|---------|
| `src/state/queries/post-feed.ts` | Feed filtering pipeline — add alt text check in the `select` callback or as a `FeedTuner` step |
| `src/state/persisted/schema.ts` | Add `hidePostsMissingAltText` boolean preference |

## Implementation Approach

### 1. Preference

```ts
// src/state/persisted/schema.ts
hidePostsMissingAltText: z.boolean().optional().default(false)
```

### 2. Filter Logic

In the feed tuner or select callback:

```ts
if (hidePostsMissingAltText) {
  const embed = post.embed
  if (embed?.$type === 'app.bsky.embed.images#view') {
    const hasImageMissingAlt = embed.images.some(img => !img.alt || img.alt.trim() === '')
    if (hasImageMissingAlt) {
      // Filter out this post
    }
  }
  // Also check recordWithMedia embeds (image + link card combos)
  if (embed?.$type === 'app.bsky.embed.recordWithMedia#view') {
    const media = embed.media
    if (media?.$type === 'app.bsky.embed.images#view') {
      const hasImageMissingAlt = media.images.some(img => !img.alt || img.alt.trim() === '')
      if (hasImageMissingAlt) {
        // Filter out
      }
    }
  }
}
```

## Edge Cases

- Quote posts with images: check the quoted post's images too, or only the outer post
- `recordWithMedia` embeds: images combined with link cards — check the images portion
- Video embeds: videos don't typically have alt text in the current schema — decide whether to include them
- Reposted images: the repost carries the original embed, so the check applies naturally
