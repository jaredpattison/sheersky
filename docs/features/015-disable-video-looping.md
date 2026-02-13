# Disable Video Looping

**GitHub Issue:** [#8469](https://github.com/bluesky-social/social-app/issues/8469)
**Upvotes:** 19
**Category:** Feature — Media Playback
**Effort:** Low
**Scope:** Client-side only

## Problem

Videos in the feed auto-loop endlessly. Users want an option to play once and stop, especially for longer videos that aren't meant to be GIF-like loops.

## Expected Behavior

- New setting: "Loop videos" (toggle, default: on for backward compatibility)
- When disabled, videos play once and show a replay button at the end
- GIF-style videos (`presentation === 'gif'`) always loop regardless of setting

## Key Files

| File | Purpose |
|------|---------|
| `src/components/Post/Embed/VideoEmbed/VideoEmbedInner/VideoEmbedInnerWeb.tsx` | Web video player — `loop` prop is set at line 72, controlled by HLS hook logic (lines 265-323) |
| `src/components/Post/Embed/VideoEmbed/VideoEmbedInner/VideoEmbedInnerNative.tsx` | Native video player |
| `src/components/Post/Embed/VideoEmbed/index.web.tsx` | Video embed container — detects GIF presentation (line 44: `embed.presentation === 'gif'`) |
| `src/state/preferences/autoplay.tsx` | Existing autoplay preference — pattern to follow for loop preference |

## Implementation Approach

### 1. Preference

```ts
// src/state/preferences/video-loop.tsx (following autoplay.tsx pattern)
// Or add to existing persisted schema:
disableVideoLoop: z.boolean().optional().default(false)
```

### 2. Video Player Change

In the web video player, conditionally disable looping:

```ts
// VideoEmbedInnerWeb.tsx
const disableLoop = useVideoLoopDisabled()
const isGif = embed.presentation === 'gif'

// Override loop behavior
const effectiveLoop = isGif ? loop : (disableLoop ? false : loop)

<video loop={effectiveLoop} ... />
```

For the manual loop logic (HLS quality upgrade on loop), skip the `ended` event re-seek when looping is disabled.

### 3. Replay UI

When video ends and looping is disabled, show a replay overlay:

```tsx
const [ended, setEnded] = useState(false)

<video onEnded={() => !effectiveLoop && setEnded(true)} />

{ended && (
  <Pressable onPress={() => { videoRef.current.currentTime = 0; videoRef.current.play(); setEnded(false) }}>
    <ReplayIcon />
  </Pressable>
)}
```

## Edge Cases

- HLS quality upgrade loop: the current code manually loops to flush low-quality buffers — when looping is disabled, this optimization doesn't apply
- GIF videos: always loop regardless of setting (they're short, expected to loop)
- Native player: may use different loop mechanism — apply same conditional logic
- Autoplay disabled + loop disabled: video should show play button, play once on tap, then show replay
