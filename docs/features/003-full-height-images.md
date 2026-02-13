# Full-Height Images / Optional Crop

**GitHub Issue:** [#5263](https://github.com/bluesky-social/social-app/issues/5263)
**Upvotes:** 133
**Category:** Feature — Media Display
**Effort:** Low
**Scope:** Client-side only

## Problem

Images in the feed are force-cropped to a constrained aspect ratio, cutting off tall/portrait images. Artists, photographers, and comic creators are frustrated that their work is cropped in the timeline.

## Expected Behavior

- A user setting: "Show full images in feed" (toggle)
- When enabled, images display at their original aspect ratio (up to a reasonable max height)
- When disabled, current crop behavior is preserved
- Tapping an image still opens the full-resolution lightbox

## Key Files

| File | Purpose |
|------|---------|
| `src/components/Post/Embed/ImageEmbed.tsx` | Image embed renderer — handles single and multi-image layouts, applies aspect ratio constraints |
| `src/view/com/util/images/Gallery.tsx` | Gallery grid component for multi-image posts |
| `src/view/com/lightbox/Lightbox.web.tsx` | Full image viewer (web) |
| `src/state/lightbox.tsx` | Lightbox state management |

## Implementation Approach

### 1. User Preference

Add a toggle in Settings > Appearance:

```ts
// src/state/persisted/schema.ts
showFullImages: z.boolean().optional().default(false)
```

### 2. Image Rendering

In the image embed component, the aspect ratio is currently constrained. When `showFullImages` is true:

- Single image: render at original aspect ratio, capped at a max height (e.g., 600px or 75vh on web)
- Multi-image grid: keep the current grid layout (cropping is necessary for grids to look consistent)

```tsx
const aspectRatio = image.aspectRatio
  ? image.aspectRatio.width / image.aspectRatio.height
  : 1

const style = showFullImages && imageCount === 1
  ? { aspectRatio, maxHeight: 600 }
  : { aspectRatio: constrainedRatio }  // current behavior
```

### 3. Image Dimensions

Post image embeds include `aspectRatio` data (`width` and `height`) in the `app.bsky.embed.images` record. This data is already available in the feed response — no additional API calls needed.

## Edge Cases

- Very tall images (e.g., 1:10 ratio): cap at reasonable max height to prevent one post from filling multiple screens
- Multi-image posts: keep grid crop behavior; only apply full-height to single-image posts
- GIF embeds: should also respect full-height when single
- Missing aspect ratio data: fall back to current behavior (some older posts may lack dimensions)
