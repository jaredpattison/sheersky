# Account Switcher Privacy Leak

**GitHub Issue:** [#7271](https://github.com/bluesky-social/social-app/issues/7271)
**Category:** Bug Fix — Privacy
**Effort:** Low
**Scope:** Client-side only

## Problem

The account switcher sends API requests that include DIDs of all logged-in accounts to the PDS server. This allows the server operator to associate multiple accounts as belonging to the same person, undermining the privacy of users with alt accounts.

## Expected Behavior

- Switching accounts should not leak information about other logged-in accounts to any server
- Each account's API calls should only include that account's own credentials and DID
- Account list should be managed entirely client-side

## Key Files

| File | Purpose |
|------|---------|
| `src/state/session/` | Session management — handles multi-account login, account switching |

## Implementation Approach

### 1. Audit API Calls

Review what happens during account switching:
- Identify any API calls that include multiple DIDs
- Check if session refresh requests leak other account DIDs
- Verify that notifications/unread-count polling for inactive accounts doesn't leak associations

### 2. Isolate Sessions

Ensure each account's agent operates independently:

```ts
// Each account should have its own agent instance
// When switching, only the active account's agent makes requests
// Background polling for inactive accounts should use separate connections

// Don't batch-fetch profile data for all accounts in a single request
// Instead, fetch each account's data with that account's own session
```

### 3. Stagger Requests

If checking unread counts for multiple accounts, stagger the requests so they don't appear to come from the same client simultaneously (though this is a weaker mitigation).

## Edge Cases

- Push notifications: if using a push service, the token registration may associate accounts server-side — harder to fix
- IP address: multiple accounts from the same IP already suggest association — this fix addresses the API-level leak, not the network-level one
- Same PDS: if multiple accounts are on the same PDS, the operator can already correlate by IP — but API-level association is more definitive
- Different PDS: accounts on different servers shouldn't leak to each other's servers at all
