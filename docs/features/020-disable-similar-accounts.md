# Disable "Similar Accounts" on Profiles

**GitHub Issue:** [#8851](https://github.com/bluesky-social/social-app/issues/8851)
**Upvotes:** 7
**Category:** Feature — Profile UX
**Effort:** Low
**Scope:** Client-side only

## Problem

Profile pages show a "Similar Accounts" / "Suggested Accounts" section that takes up space and isn't always useful. Users want the option to hide it.

## Expected Behavior

- Setting in Preferences: "Show similar accounts on profiles" (toggle, default: on)
- When disabled, the similar accounts section is not rendered on profile pages
- No API calls are made for similar accounts when disabled (saves bandwidth)

## Key Files

| File | Purpose |
|------|---------|
| `src/screens/Profile/` | Profile screen components |
| `src/state/queries/suggested-follows.ts` | Query for suggested/similar accounts |

## Implementation Approach

### 1. Preference

```ts
// src/state/persisted/schema.ts
showSimilarAccounts: z.boolean().optional().default(true)
```

### 2. Conditional Rendering

In the profile screen, conditionally render the similar accounts section:

```tsx
const showSimilarAccounts = useShowSimilarAccounts()

{showSimilarAccounts && (
  <SimilarAccountsSection profileDid={did} />
)}
```

### 3. Skip Query

When the preference is off, pass `enabled: false` to the suggested follows query to prevent unnecessary API calls.

## Edge Cases

- Own profile: similar accounts may not show on your own profile anyway
- New users: similar accounts can be helpful for discovery — default should be on
