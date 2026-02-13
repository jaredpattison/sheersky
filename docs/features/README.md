# SheerSky Feature Backlog

Client-side features and bug fixes sourced from [bluesky-social/social-app](https://github.com/bluesky-social/social-app/issues) issues, community feedback, and third-party client comparisons. All items are implementable without server/protocol changes.

## Features — High Demand

| # | Feature | Upvotes | Effort | Doc |
|---|---------|---------|--------|-----|
| 001 | Hide reposts per followed account | 391 | Low-Med | [001](001-hide-reposts-per-account.md) |
| 002 | Feed position memory / don't auto-scroll | 528 | Medium | [002](002-feed-position-memory.md) |
| 003 | Full-height images / optional crop | 133 | Low | [003](003-full-height-images.md) |
| 004 | Hide posts missing alt text | 79 | Low | [004](004-hide-posts-missing-alt-text.md) |
| 005 | Keyboard shortcuts (web) | 67 | Medium | [005](005-keyboard-shortcuts-web.md) |
| 006 | Thread collapsing | 50 | Medium | [006](006-thread-collapsing.md) |
| 007 | Spoiler tags | 43 | Medium | [007](007-spoiler-tags.md) |
| 008 | Fine-grained muting (timed, per-type) | 34 | Medium | [008](008-fine-grained-muting.md) |
| 009 | Default moderation label states | 63 | Low | [009](009-default-moderation-labels.md) |
| 010 | Filter search to followed users | 38 | Low-Med | [010](010-filter-search-followed-only.md) |
| 011 | Blur DM images from non-mutuals | 34 | Low | [011](011-blur-dm-images-non-mutuals.md) |

## Features — Medium Demand

| # | Feature | Upvotes | Effort | Doc |
|---|---------|---------|--------|-----|
| 013 | Landscape / rotation unlock | 22 | Medium | [013](013-landscape-orientation.md) |
| 014 | Custom accent color | 20 | Medium | [014](014-custom-accent-color.md) |
| 015 | Disable video looping | 19 | Low | [015](015-disable-video-looping.md) |
| 019 | Disable reposts in list views | 9 | Low | [019](019-disable-reposts-in-lists.md) |
| 020 | Disable "Similar Accounts" on profiles | 7 | Low | [020](020-disable-similar-accounts.md) |
| 024 | Hide engagement counts | — | Low | [024](024-hide-engagement-counts.md) |
| 025 | Code block syntax highlighting | 156 | Medium | [025](025-code-block-syntax-highlighting.md) |
| 026 | Inline post translation | — | Medium | [026](026-inline-post-translation.md) |
| 027 | Notification grouping | — | Medium | [027](027-notification-grouping.md) |
| 028 | Search within profiles | — | Low-Med | [028](028-search-within-profiles.md) |
| 029 | Swipe actions on posts (native) | — | Medium | [029](029-swipe-actions-posts.md) |
| 030 | iPad / tablet layout | 68 | High | [030](030-ipad-tablet-layout.md) |
| 034 | Follow all from user's following list | — | Medium | [034](034-follow-all-from-profile.md) |

## Bug Fixes

| # | Bug | Upvotes | Effort | Doc |
|---|-----|---------|--------|-----|
| 012 | Browser back should close lightbox | 22 | Low | [012](012-browser-back-closes-lightbox.md) |
| 016 | Avoid unnecessary JPEG re-encoding | 12 | Low | [016](016-avoid-jpeg-reencoding.md) |
| 017 | Muted users show in search results | 11 | Low | [017](017-muted-users-in-search.md) |
| 018 | Blocklists should not block followed users | 11 | Low | [018](018-blocklist-follow-exception.md) |
| 021 | Mute words don't mute entire threads | 2 | Low-Med | [021](021-mute-words-entire-threads.md) |
| 022 | Copying handles includes bidi characters | 3 | Low | [022](022-copy-handle-bidi-chars.md) |
| 023 | Link cards not proper anchor elements | — | Low | [023](023-link-cards-anchor-elements.md) |
| 031 | Account switcher privacy leak | — | Low | [031](031-account-switcher-privacy.md) |
| 032 | Feed stops responding to taps | — | Low-Med | [032](032-feed-tap-responsiveness.md) |
| 033 | UI jiggling during scroll | — | Low | [033](033-ui-jiggling.md) |

## Quick Win Candidates (Low Effort)

For rapid iteration, start with these:
1. **009** — Default moderation labels (config change only)
2. **015** — Disable video looping (single prop toggle)
3. **020** — Disable similar accounts (conditional render)
4. **024** — Hide engagement counts (conditional render)
5. **017** — Muted users in search (add `moderateProfile()` call)
6. **022** — Copy handle bidi chars (regex strip)
7. **016** — Avoid JPEG re-encoding (check before compress)
8. **004** — Hide posts missing alt text (simple filter)
9. **018** — Blocklist follow exception (moderation filter tweak)

## Already Addressed by SheerSky

These issues are partially or fully covered by existing soft-block work:
- **#7021** — Blocked users' replies hidden from everyone
- **#2028** — Can't unfollow if blocked
- **#6464** — Blocklists blocking followed users (see #018 for full fix)
- **#1160** — Remove follower (block/unblock workaround)
