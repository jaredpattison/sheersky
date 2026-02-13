# Change Default Moderation Label States

**GitHub Issue:** [#7030](https://github.com/bluesky-social/social-app/issues/7030)
**Upvotes:** 63
**Category:** Feature — Moderation
**Effort:** Low
**Scope:** Client-side only

## Problem

Bluesky's moderation labels like "Intolerant" and "Rude" default to "warn" (show behind a content warning). Many users want these to default to "hide" so they never see this content unless they explicitly opt in.

## Expected Behavior

- SheerSky ships with stricter default moderation label preferences
- "Intolerant", "Rude", and similar labels default to "hide" instead of "warn"
- Users can still adjust these in Settings > Moderation to "warn" or "show" if they prefer
- No functional change — just different default values

## Key Files

| File | Purpose |
|------|---------|
| `src/state/queries/preferences/moderation.ts` | Moderation preference queries and defaults |
| `@atproto/api` | `ModerationOpts` and label preference types |

## Implementation Approach

Override the default label preferences when initializing moderation options. The moderation system already supports per-label visibility settings (`hide`, `warn`, `ignore`). Change the defaults for specific label values:

```ts
const SHEERSKY_LABEL_DEFAULTS: Record<string, LabelPreference> = {
  intolerant: 'hide',    // upstream default: 'warn'
  rude: 'hide',          // upstream default: 'warn'
  // Add others as desired
}
```

Apply these defaults when the user hasn't explicitly set a preference for a label.

## Edge Cases

- User has existing preferences: don't override explicitly set values, only apply to unset labels
- New labels added upstream: fall back to upstream defaults for unknown labels
- Migration: existing SheerSky users who upgrade should get the new defaults only for labels they haven't touched
