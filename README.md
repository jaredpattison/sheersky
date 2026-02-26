# SheerSky

[![React Native](https://img.shields.io/badge/React_Native-0.81-blue?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![AT Protocol](https://img.shields.io/badge/AT_Protocol-atproto-0285c7)](https://atproto.com/)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey)]()

**SheerSky** is an AT Protocol social client built with React Native and Expo. It's a substantial fork of the [Bluesky Social app](https://github.com/bluesky-social/social-app) — adding 6 features, a full visual rebrand, and 1,200+ lines of tests across **17 commits, 258 files changed, and 7,500+ lines added**.

> This project demonstrates production-level React Native development across iOS, Android, and Web — including native module integration, cross-platform UI patterns, custom feed algorithms, and deep integration with the AT Protocol API.

---

## Features Built

### Soft Block & Blocked Me Feed
Shows content from users who have blocked you, using an unauthenticated API fallback layer that preserves moderation labels. Aggregates these posts into a dedicated "Blocked Me" home feed tab powered by the [ClearSky API](https://clearsky.app/).

**Key implementation details:**
- Moderation cause filtering (`blocked-by`, `block-other`) with configurable stripping
- Unauthenticated public API fallback (`api.bsky.app/xrpc/`) for blocked content resolution
- Extended across quote embeds, threads, search results, feed items, orphaned replies, profiles, and list/feed embeds
- Custom `FeedAPI` implementation for the Blocked Me tab with cursor-based pagination

### Code Blocks & Inline Code
Client-side rendering of triple-backtick fenced code blocks and inline backtick code in posts. Monospace font, contrast backgrounds, horizontal scroll, copy button, and optional language labels.

**Key implementation details:**
- UTF-16 ↔ UTF-8 byte-index bridging using `@atproto/api`'s `UnicodeString` to correctly align facet positions with parsed code regions — critical for posts mixing code with mentions/links
- Fast-path optimization: posts without backticks skip code parsing entirely
- Language identifier detection distinguishes hints (e.g., `ts`) from code on the opening fence line
- 42 unit tests covering edge cases (nested backticks, adjacent regions, Unicode content)

### Hide Reposts Per Account & Repost Deduplication
Per-account toggle to hide reposts from specific users, plus automatic dedup of identical reposts across accounts in Following/List feeds.

**Key implementation details:**
- Composable `FeedTuner` higher-order function architecture — `hideRepostsFrom(dids)` and `dedupReposts` are independent tuner functions composed into the feed pipeline
- Split React Context pattern: `useHiddenRepostDids()` (read) and `useHiddenRepostDidsApi()` (write) prevent unnecessary re-renders
- Dedup state persists across pagination boundaries via `seenPostUrisForRepostDedup` set on the FeedTuner instance
- Management UI with chunked profile resolution (25/batch via `getProfiles`) and progressive disclosure
- 11 unit tests

### Feed Position Memory
Preserves reading position when "Load New" is tapped, instead of jumping to the top. Users see new posts without losing their place.

### Keyboard Shortcuts (Web)
Web-only keyboard shortcuts for power users: two-key sequences (`g h` for Home, `g n` for Notifications, etc.), single-key actions (`/` for search, `.` for refresh, `n` for compose), and a `?` help dialog. Built as a platform-gated hook with proper input guards and overlay detection.

### Full Visual Rebrand
Complete UI overhaul: custom logo (SVG path-based mountain peak mark + Inter Bold logotype), Sky Cyan (`#0284C7`) primary palette with teal-tinted contrast scales for light/dark/dim themes, tab bar accent colors, in-app legal pages, centralized URL management, and disabled telemetry.

---

## Technical Highlights

### Cross-Platform Patterns
- **Platform-specific file resolution** (`.web.tsx`, `.native.tsx`, `.ios.tsx`) for Dialog, Menu, storage, and scroll behavior — bundler auto-resolves, no runtime conditionals for imports
- **Platform utility functions** (`web()`, `native()`, `ios()`, `platform()`) for inline style branching
- **Monospace font handling** across platforms (system font stacks on web vs. explicit font family on native)
- **Responsive breakpoints** via `useBreakpoints()` hook for phone/tablet/desktop layouts

### Keyboard Shortcut System
- Platform-gated via file resolution (`.web.tsx` hook with real logic, `.tsx` no-op for native)
- Two-key sequence support with configurable timeout (`g h`, `g n`, etc.)
- Input guard prevents activation during text editing (inputs, textareas, contenteditable)
- Overlay-aware: disabled when dialogs, modals, lightbox, drawer, or composer are open
- Help dialog rendered as a standard Dialog component, triggered by `?`

### Feed Architecture
- `FeedTuner` composes higher-order filter functions into a pipeline — each tuner is a pure function `(tuner, slices) => slices`, making them independently testable and composable
- `FeedAPI` abstraction allows plugging in custom data sources (ClearSky, local filters) alongside standard AT Protocol feeds
- `FeedDescriptor` routing maps string identifiers to API implementations via `createApi()`

### State Management
- **TanStack Query** for all server state with configured stale times (`STALE.MINUTES.FIVE`, `STALE.INFINITY`, etc.)
- **Persisted preferences** via Zod-validated schema → AsyncStorage, with migration support
- **Split Context providers** to separate read and write concerns (e.g., hidden reposts state vs. mutation API)

### AT Protocol Integration
- Typed Lexicon APIs via `@atproto/api` agent
- Cursor-based pagination with `useInfiniteQuery`
- Moderation pipeline integration (`moderatePost()` in feed query select callbacks)
- Unauthenticated API layer for public data access when authenticated requests are blocked

---

## Architecture

```
src/
├── alf/                    # Design system — themes, atoms, tokens (Tailwind-inspired)
├── components/             # Shared UI (Button, Dialog, Menu, TextField, CodeBlock, InlineCode)
├── screens/                # Screen components (newer pattern)
├── view/
│   ├── screens/            # Screen components (legacy)
│   ├── com/                # Reusable view components
│   └── shell/              # App shell, navigation bars, tab bar
├── state/
│   ├── queries/            # TanStack Query hooks (feed, profile, notifications, etc.)
│   ├── preferences/        # React Context providers (hidden reposts, feed tuners, etc.)
│   ├── session/            # Authentication state
│   └── persisted/          # Zod-validated persistent storage layer
├── lib/
│   ├── api/                # Feed manipulation, unauthenticated API, soft block utilities
│   ├── moderation/         # Moderation cause filtering (soft block)
│   ├── strings/            # Code detection, string utilities
│   └── hooks/              # Shared hooks
├── locale/                 # i18n (Lingui) — 30+ languages
└── Navigation.tsx          # React Navigation configuration
```

### Native Modules (Expo Modules API / JSI)

| Module | Purpose |
|--------|---------|
| `expo-bluesky-swiss-army` | Shared preferences, image manipulation, device info |
| `expo-bluesky-gif-view` | Native GIF rendering with pause/play |
| `bottom-sheet` | Native bottom sheet with gesture handling |
| `expo-scroll-forwarder` | Nested scroll coordination |
| `expo-background-notification-handler` | Background push notification processing |
| `expo-receive-android-intents` | Android share intent handling |
| `expo-emoji-picker` | Native emoji picker |
| `BlueskyNSE` | iOS Notification Service Extension |
| `Share-with-Bluesky` | iOS/Android share extension |
| `BlueskyClip` | iOS App Clip |

---

## Test Coverage

| Feature | Tests | Lines |
|---------|-------|-------|
| Code blocks & detection | 42 | ~550 |
| Keyboard shortcuts | 11 | ~100 |
| Hide reposts & dedup | 11 | ~350 |
| Soft block & feed | — | ~270 |
| **Total new tests** | **64+** | **~1,270** |

Run tests:
```bash
yarn test
```

---

## Feature Roadmap

34 documented feature specs in [`docs/features/`](./docs/features/), sourced from community feedback and prioritized by demand. Each spec includes implementation approach, key files, edge cases, and effort estimates.

Top upcoming features by community votes:
- Full-height images (133 votes)
- Alt text filter (79 votes)
- Keyboard shortcuts for web (67 votes)
- Tablet layout optimization (68 votes)
- Thread collapsing (50 votes)

---

## Development

```bash
# Install dependencies
yarn install

# Start Expo dev server
yarn start

# Platform-specific
yarn web                # Web (localhost:19006)
yarn ios                # iOS Simulator
yarn android            # Android Emulator

# Quality checks
yarn test               # Jest tests
yarn lint               # ESLint
yarn typecheck          # TypeScript
yarn intl:compile       # Compile i18n translations
```

### Build

```bash
yarn build-web          # Production web build
yarn prebuild           # Generate native projects
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo 54 |
| Language | TypeScript 5.x |
| Navigation | React Navigation 7 |
| Data fetching | TanStack Query (React Query) |
| Styling | ALF (custom design system, Tailwind-inspired atoms) |
| i18n | Lingui (30+ languages) |
| Protocol | AT Protocol (`@atproto/api`) |
| Native modules | Expo Modules API (JSI-based) |
| Compiler | React Compiler (automatic memoization) |

---

## Upstream

Forked from [bluesky-social/social-app](https://github.com/bluesky-social/social-app). SheerSky is a third-party AT Protocol client — it connects to the same decentralized network.

Learn more about AT Protocol: [atproto.com](https://atproto.com/)
