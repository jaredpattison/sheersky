# SheerSky — Bluesky Fork Project Plan

## Context

We're forking Bluesky's open-source social-app to create **SheerSky** — a rebranded, customized social media client. The key motivations are:
- Change blocking behavior so users can still view posts after being blocked (soft block)
- Build a Mac desktop app for big-screen viewing
- Customize feeds (longer term, via feed generators)
- Start on the existing Bluesky/AT Protocol network, with a path to running our own infrastructure later

## Phase 1: Fork & Rebrand ✅ COMPLETE

**Goal**: Fork the social-app repo and replace all Bluesky branding with SheerSky.

### Steps:
1. Fork `bluesky-social/social-app` to your GitHub account
2. Clone the fork locally into this project directory
3. Update branding in these files:
   - `app.config.js` — app name ("SheerSky"), slug, scheme, bundle ID (`com.sheersky.app`), owner, primary color
   - `package.json` — package name, description
   - `/assets/` — replace logo.png, favicon.png, app icons (all variants: Aurora, Bonfire, etc.), splash screen assets
   - `/src/lib/constants.ts` — update hardcoded URLs (help desk, download, status page)
   - `/web/index.html` — replace splash screen SVG logo, page title placeholder
   - `/bskyweb/` — update Go web server branding
4. Search entire codebase for remaining "Bluesky", "bluesky", "bsky" strings and update where appropriate (skip AT Protocol references like `app.bsky.*` lexicons — those are protocol identifiers, not branding)
5. Replace analytics and error-collection integrations (Sentry, etc.) with our own or remove
6. Update support links: feedback URL, terms of service, privacy policy
7. Build and verify the web version runs with new branding

### Key files:
- `app.config.js` — primary app configuration
- `package.json` — project metadata
- `/assets/` — all visual assets
- `/src/lib/constants.ts` — service URLs and constants
- `/web/index.html` — web entry point

## Phase 2: Soft Block (View Posts After Being Blocked) ✅ COMPLETE

**Goal**: Allow users to see posts from accounts that have blocked them, with a visual indicator.

### How blocking currently works:
- Blocks are stored as `app.bsky.graph.block` records in the AT Protocol
- The API returns `viewer.blockedBy: true` on profiles/posts when someone has blocked you
- The client previously hid this content, showing "Blocked post" placeholder
- Block enforcement (preventing replies, mentions, likes) happens server-side at the PDS

### What was changed (client-side only):
1. Separated `blockedBy` (they blocked us) from `blocking` (we blocked them) throughout the client
2. Profiles of users who blocked you now show full content (metrics, description, posts, known followers) with an info banner: "This user has blocked you. Some interactions may be limited."
3. ScreenHider overlay bypassed for `blocked-by` moderation causes
4. ProfileCard and ProfileHoverCard show descriptions for blocked-by users
5. Moderation text updated — softer icon (CircleInfo) and messaging ("You can still view their content")
6. Thread tombstones softened to "Post not available" (server doesn't provide blocked post content)
7. Toast messages differentiated: "This user has blocked you" vs "Cannot interact with a blocked user"
8. Interaction buttons (Follow, Subscribe, Message) stay hidden for blocked-by users since server rejects those actions

### Files modified:
- `src/lib/moderation/blocked-and-muted.ts` — Added `isBlockingUser()`, `isBlockedByUser()`
- `src/lib/moderation/soft-block.ts` — New `filterBlockedByCauses()` utility
- `src/screens/Profile/Header/ProfileHeaderStandard.tsx` — Admonition banner, show content
- `src/screens/Profile/Header/Handle.tsx` — Show "Follows you" badge
- `src/view/screens/Profile.tsx` — Filter ScreenHider modui
- `src/components/ProfileCard.tsx` — Show description
- `src/components/ProfileHoverCard/index.web.tsx` — Show content on web
- `src/lib/moderation/useModerationCauseDescription.ts` — Softer icon + text
- `src/components/moderation/ModerationDetailsDialog.tsx` — Updated text
- `src/screens/PostThread/components/ThreadItemPostTombstone.tsx` — "Post not available"
- `src/components/Post/PostRepliedTo.tsx` — "Replied to an unavailable post"
- `src/components/PostControls/index.tsx` — Context-specific toasts
- `src/state/shell/composer/index.tsx` — Context-specific toasts

### What does NOT change:
- The AT Protocol itself
- Server-side block enforcement
- The ability to block others (that stays as-is)
- `app.bsky.*` lexicon schemas
- Thread post content for blocked items (server limitation — API returns `ThreadItemBlocked` without content)

## Phase 3: Mac Desktop App (Tauri)

**Goal**: Wrap the existing web build in Tauri v2 for a native macOS app.

### Why Tauri:
- Uses system WebView (WebKit on macOS) — no bundled Chromium
- ~10MB app bundle vs 100MB+ for Electron
- Fast startup, low memory usage
- Growing ecosystem (35% YoY adoption growth)

### Steps:
1. Install Tauri CLI and Rust toolchain
2. Initialize Tauri in the repo alongside the existing web build
3. Configure Tauri to serve the Expo/React Native Web webpack output
4. Add macOS-specific features: keyboard shortcuts, window management, menu bar, notifications
5. Build and test the .app bundle
6. Set up code signing for macOS distribution (Apple Developer account needed)

## Phase 4: Infrastructure (Future)

**Goal**: Understand the path from using Bluesky's network to running our own.

### Current state (Phase 1-3):
- SheerSky connects to `bsky.social` / `bsky.network` — the existing Bluesky infrastructure
- No backend to manage, no AWS costs
- Users sign up through Bluesky's PDS

### Long-term path:
- **Run our own PDS** — host user accounts, ~1GB RAM / 20GB SSD for small scale
- **Run a Relay** — aggregate data from PDSes (resource-intensive)
- **Run an AppView** — index data for feeds and search
- **Feed Generators** — custom algorithms (can do this without own infrastructure)
- **Infrastructure**: LocalStack for dev, then AWS for production

### Benefits of own backend:
- Control user data and accounts
- Custom moderation policies
- Independence from Bluesky's infrastructure decisions
- Can still federate with the broader AT Protocol network

## Git Workflow

- **origin** → `jaredpattison/sheersky` (our fork)
- **upstream** → `bluesky-social/social-app` (pull future Bluesky updates)
- Work on `rebrand/sheersky` branch
- Keep `main` clean and synced with upstream
- Each phase gets its own commit(s)
- Merge to `main` when each phase is stable

## Verification

- **Web build**: Run the dev server and verify SheerSky branding loads
- **Blocking**: Test with accounts that block each other, verify posts are visible with indicator
- **Mac app**: Build Tauri bundle, launch .app, verify it loads and functions
- **Linting/tests**: Run existing test suite to ensure nothing breaks (`yarn test`)
