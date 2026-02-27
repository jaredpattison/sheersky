# SheerSky Differentiation Strategy

Avoiding Apple Guideline 4.2 (Copycat/Minimum Functionality) rejection is the biggest risk. This document outlines existing differentiators, competitor analysis, and new feature ideas.

---

## Existing Differentiators (Already Implemented)

These features are NOT in the official Bluesky app or any other third-party client:

| Feature | Description | Visibility |
|---------|-------------|------------|
| **Soft Block Transparency** | View posts from users who blocked you via public API fallback | Visible when encountering blocked content |
| **Blocked-By Feed** | Dedicated home feed tab aggregating posts from all blockers | Immediately visible on Home screen |
| **Code Block Rendering** | Triple-backtick fenced code with monospace, language labels, copy button; inline backtick code | Visible on any post with code |
| **Per-Account Repost Hiding** | Toggle to hide reposts from specific accounts in Following feed | Profile menu > three-dot menu |
| **Repost Deduplication** | Auto-removes duplicate reposts of same post across accounts | Always active on Following feed |
| **Custom Visual Identity** | Teal/cyan palette (#0284C7), mountain peak logo, teal-tinted dark themes | Immediately visible |
| **Biometric App Lock** | Face ID / Touch ID native module (expo-app-lock) | Settings > Privacy & Security |
| **Secure Keychain Storage** | Custom Expo native module for iOS Keychain credential storage | Transparent to user |

---

## Competitor Landscape

### Active iOS Clients

| Client | Key Differentiator | Pricing | Threat Level |
|--------|-------------------|---------|-------------|
| **Skeets** | Native iOS feel, push notifications, VoiceOver, alt-text generator | ~$2/mo or ~$18/yr | High — most polished |
| **Dragonfly** | Multi-account, cross-device sync, macOS/iPad focus | ~EUR 1/mo | Low — different platform focus |
| **Phoenix (Tapbots)** | Tapbots design heritage, premium native SwiftUI | Not yet released | Future threat |
| **IcySky** | SwiftUI, iOS 26 Liquid Glass effects | Early stage | Low — experimental |
| **Graysky** | Feeds-first layout, inline translation | Maintenance mode | Low — no new features |

### What SheerSky Has That No Competitor Does
- Soft block viewing (unique in the ecosystem)
- Blocked-by feed (unique)
- Code block rendering (unique — no client renders markdown code blocks)
- Repost management (hide per-account + dedup — unique combination)

---

## Quick-Win Differentiation Ideas (1-3 Days Each)

### Tier 1 — High Impact, Easy to Implement

1. **Wire biometric app lock into the app** (~1 day)
   - Module already built (expo-app-lock), just needs provider wiring
   - Settings > Privacy & Security > enable App Lock
   - Native Face ID/Touch ID — very visible differentiator
   - Plan exists at `.claude/plans/transient-mixing-lobster.md`

2. **Custom accent color picker** (~1-2 days)
   - Let users choose their own accent color beyond the default teal
   - Skeets has this; it's a proven differentiator
   - Store in persisted preferences, apply to primary palette

3. **Font size / line spacing controls** (~1 day)
   - Beyond system Dynamic Type, offer in-app controls
   - Compact / Default / Relaxed line spacing
   - Small / Default / Large font multiplier
   - Immediately visible customization

4. **Thread collapsing** (~2 days)
   - Tap to collapse long reply chains in thread view
   - Highly requested feature (50+ upvotes on GitHub)
   - Simple UI: tap collapse indicator → hides child replies

5. **Enhanced alt-text experience** (~1-2 days)
   - Toggle to show alt text inline below images
   - Highlight posts missing alt text
   - Accessibility win — Apple looks favorably on this

### Tier 2 — Medium Impact, Moderate Effort

6. **Inline translation** (~2 days)
   - Use Apple's built-in Translation APIs (iOS 17+)
   - One-tap translate button on foreign-language posts
   - Graysky had this; official app doesn't

7. **Reading mode / distraction-free view** (~2 days)
   - Strip like/repost counts, show just text in clean typography
   - Good for long threads
   - Toggle in post/thread view

8. **Timeline density options** (~2 days)
   - Compact (more posts visible) / Comfortable (current) / Expanded (bigger images)
   - Simple multiplier on padding/image heights

9. **Multi-account quick switcher** (~2 days)
   - Long-press profile tab to switch accounts without going through settings
   - Power user feature

10. **Mute words with regex** (~1-2 days)
    - Official app has basic mute words; add regex pattern support
    - Power user feature for precise filtering

### Tier 3 — Nice to Have

11. **Incognito browsing mode** (~2 days)
    - Browse via unauthenticated API (like soft block already does)
    - Privacy-focused feature

12. **Post scheduling / drafts with time** (~2-3 days)
    - Draft infrastructure exists; add a time picker for future publishing

13. **Keyboard shortcuts (web/iPad)** (~2 days)
    - Navigate feeds, compose, like/repost with keyboard
    - j/k navigation, n for new post, etc.

14. **Full-height images** (~2 days)
    - Display tall images uncropped in timeline
    - 133 upvotes in the Bluesky backlog

15. **High contrast mode** (~1-2 days)
    - True high contrast theme for low-vision users
    - Beyond standard dark/dim

---

## Recommended Pre-Submission Priorities

Focus on features that are **immediately visible** to an Apple reviewer spending 5 minutes in the app:

1. **Wire biometric app lock** — Reviewers see this in Settings, it's a native capability
2. **Custom accent color picker** — Shows customization depth
3. **Thread collapsing** — Improves UX noticeably
4. **Enhanced alt-text** — Accessibility win

These 4 features plus the existing 6 unique features give Apple reviewers 10+ clear differentiators.

---

## App Store Description Strategy

The description should lead with what makes SheerSky different, NOT with "it's a Bluesky client":

```
SheerSky — a powerful AT Protocol client with features you won't find anywhere else.

See what your blockers are posting. Render code blocks beautifully. Take control of
your feed with per-account repost hiding and deduplication. Lock your app with Face ID.
Customize your experience with multiple themes and accent colors.

UNIQUE FEATURES:
- Soft Block Transparency — See posts from users who blocked you
- Blocked-By Feed — All your blockers' posts in one place
- Code Blocks — Beautiful rendering of code in posts
- Repost Control — Hide reposts per account, auto-deduplicate
- Biometric Lock — Face ID / Touch ID protection
- Custom Themes — Teal-tinted dark mode, accent color picker

FULL-FEATURED CLIENT:
- Browse feeds, post, message, search
- Content moderation and reporting
- Share extension, notifications
- 25+ languages supported

Built on the open AT Protocol. Your data, your network, your choice of client.
```

---

## Precedent: How Other Clients Survived Review

**Ice Cubes (Mastodon)** — Rejected 7 times under Guideline 4.2 before approval. Succeeded by:
- Emphasizing unique features (tag groups, remote timelines, AI tools)
- Getting public attention (Daring Fireball article)
- Having enough feature density that "minimum functionality" claim was indefensible

**Skeets (Bluesky)** — Approved without issues:
- Fully native iOS (different tech stack)
- Push notifications (killer feature)
- Subscription model (signals serious product)

**Ivory (Mastodon)** — Approved immediately:
- Tapbots brand recognition with Apple
- Completely unique UI language
- Premium positioning

**Key lesson:** Feature density matters more than any single feature. Have enough unique capabilities that a reviewer cannot reasonably call it "minimum functionality."
