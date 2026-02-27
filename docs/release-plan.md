# SheerSky Release Plan

## Current State

**Done:**
- App name, slug, scheme → "SheerSky" / "sheersky"
- Bundle IDs in `app.config.js` → `com.sheersky.app` (iOS + Android)
- Visual rebrand (colors, logo, logotype, tab bar, borders)
- In-app legal pages (Terms, Privacy, Community Guidelines, Copyright, Support)
- Centralized URLs in `webLinks` object
- Sidebar/drawer links → in-app routes
- Feedback → composer mentioning `@devagent.bsky.social`
- Analytics/telemetry disabled (metrics, feature flags, Sentry)
- CSS hardcoded colors updated
- Embed page titles/meta → "SheerSky"
- App group entitlement → `group.com.sheersky.app` (in app.config.js)
- Share extension → `Share-with-SheerSky` (bundle: `com.sheersky.app.Share-with-SheerSky`)
- Notification extension → `SheerSkyNSE` (bundle: `com.sheersky.app.SheerSkyNSE`)
- App Clip → `SheerSkyClip` (bundle: `com.sheersky.app.AppClip`)

---

## Cost Summary

| Item | Cost | Frequency | Required for Launch? |
|------|------|-----------|---------------------|
| Apple Developer Program | $99 | Annual | Yes (iOS) |
| Google Play Console | $25 | One-time | Yes (Android) |
| Expo EAS (Free tier) | $0 | Monthly | Yes — 30 builds/mo (max 15 iOS) |
| Firebase (FCM) | $0 | Free forever | Yes (push notifications) |
| Domain (`.app`) | ~$12-15 | Annual | Yes (universal links, web) |
| Sentry (free tier) | $0 | Monthly | No — can add post-launch |
| **Total Year 1** | **~$136-140** | | |
| **Total Year 2+** | **~$111-114** | | |

If you outgrow the free EAS build tier (30 low-priority builds/mo), Starter is $19/mo.

---

## Phase 1: Accounts & Infrastructure Setup

This is the first thing to do — everything else depends on having these accounts.

### 1A. Apple Developer Program ($99/year)

**Enroll as Individual** (simplest, no D-U-N-S number needed):

1. Go to [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/)
2. Sign in with your Apple ID (must have two-factor auth enabled)
3. Select "Individual / Sole Proprietor"
4. Enter your legal name exactly as on your government ID
5. Accept the Apple Developer Program License Agreement
6. Pay $99
7. Wait for approval — typically **a few hours to 48 hours**

**What you get:**
- **Team ID** — a 10-character string (e.g., `ABCDE12345`). You'll need this immediately for code changes.
- **App Store Connect** access — where you create your app listing, manage TestFlight, submit for review
- Auto-managed signing via EAS (certificates, provisioning profiles, push keys — all handled for you)

**After approval, do these immediately:**
- [ ] Note your Team ID (Membership > Team ID)
- [ ] Create a new app in App Store Connect:
  - Bundle ID: `com.sheersky.app`
  - App name: "SheerSky"
  - Primary language: English (U.S.)
  - SKU: `com.sheersky.app`
- [ ] Note the new **App Store ID** (numeric, shown in App Store Connect URL)
- [ ] Create App Store Connect API Key (for EAS Submit):
  - App Store Connect > Users and Access > Integrations > App Store Connect API
  - Role: "App Manager" or "Admin"
  - Download the `.p8` file — you only get one download

### 1B. Google Play Console ($25 one-time)

1. Go to [play.google.com/console](https://play.google.com/console)
2. Sign in with a Google Account
3. Select "Personal" (individual) account type
4. Pay $25
5. Complete identity verification (government-issued photo ID)
6. Wait for approval — typically **2-5 business days**

**After approval:**
- [ ] Create app listing for `com.sheersky.app`
- [ ] Create a Google Cloud Service Account for EAS Submit:
  - Google Cloud Console > IAM & Admin > Service Accounts > Create
  - Grant it "Service Account User" role
  - Create JSON key, download it
  - In Play Console > Setup > API access > link the service account
  - Grant "Release manager" permissions

### 1C. Expo / EAS Account (Free)

1. Create account at [expo.dev](https://expo.dev) if you don't have one
2. Install EAS CLI: `npm install -g eas-cli`
3. Log in: `eas login`
4. Initialize the project: `eas init` (links to your Expo account, gives new project ID)
5. Note the new **Expo Project ID** (UUID format)

**Free tier includes:**
- 30 low-priority builds/month (max 15 iOS)
- EAS Submit (to App Store and Play Store)
- EAS Update with 1,000 monthly active users
- Low-priority builds queue behind paid users but still complete

### 1D. Firebase Project (Free)

Needed for push notifications (FCM). Completely free, no usage limits that matter.

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Add project", name it "SheerSky"
3. Enable or disable Google Analytics (optional)
4. **Add Android app:**
   - Package name: `com.sheersky.app`
   - Download `google-services.json`
   - Place in project root (replaces `google-services.json.example`)
5. **Add iOS app:**
   - Bundle ID: `com.sheersky.app`
   - Download `GoogleService-Info.plist`
   - Place in project root (Expo handles placement during prebuild)

### 1E. Domain Registration (~$12-15/year)

Register `sheersky.app` (or your preferred domain). The `.app` TLD enforces HTTPS by default, which is good.

**Cheapest registrars:**
| Registrar | Price/year |
|-----------|-----------|
| Cloudflare Registrar | ~$11.18 (at-cost) |
| Dynadot | ~$10.00 first year |
| Namecheap | ~$12.98 |

**You'll need to host two files for deep linking:**
- `https://sheersky.app/.well-known/apple-app-site-association` (iOS universal links)
- `https://sheersky.app/.well-known/assetlinks.json` (Android app links)

These can be static files on any hosting (GitHub Pages, Cloudflare Pages, Vercel, etc.).

---

## Phase 2: Code Changes

Once you have your Team ID and App Store ID, make these changes. Most can be done in a single commit.

### 2A. Critical — Required for Build

| What | Where | Change to |
|------|-------|-----------|
| Apple Team ID `B3LX46C5HS` | `plugins/shareExtension/withXcodeTarget.js` | Your new Team ID |
| | `plugins/notificationsExtension/withXcodeTarget.js` | Your new Team ID |
| | `plugins/starterPackAppClipExtension/withXcodeTarget.js` | Your new Team ID |
| App group `group.app.bsky` | `modules/Share-with-Bluesky/Share-with-Bluesky.entitlements` | `group.com.sheersky.app` |
| | `modules/BlueskyNSE/BlueskyNSE.entitlements` | `group.com.sheersky.app` |
| | `modules/BlueskyClip/ViewController.swift` | `group.com.sheersky.app` |
| | `modules/expo-background-notification-handler/ios/ExpoBackgroundNotificationHandlerModule.swift` | `group.com.sheersky.app` |
| | `modules/BlueskyNSE/NotificationService.swift` | `group.com.sheersky.app` |
| | `modules/expo-bluesky-swiss-army/ios/SharedPrefs/ExpoBlueskySharedPrefsModule.swift` | `group.com.sheersky.app` |
| | `plugins/shareExtension/withExtensionEntitlements.js` | `group.com.sheersky.app` |
| | `plugins/notificationsExtension/withExtensionEntitlements.js` | `group.com.sheersky.app` |
| | `plugins/starterPackAppClipExtension/withClipEntitlements.js` | `group.com.sheersky.app` |
| Deep link `bluesky://` | `modules/Share-with-Bluesky/Info.plist` | `sheersky` |
| | `modules/BlueskyNSE/Info.plist` | `sheersky` |
| | `modules/Share-with-Bluesky/ShareViewController.swift` | `sheersky` |
| | `modules/expo-receive-android-intents/android/src/.../ExpoReceiveAndroidIntentsModule.kt` (3 occurrences) | `sheersky://` |
| Bundle ID `xyz.blueskyweb.app` | `bskylink/src/routes/siteAssociation.ts` | `com.sheersky.app` |
| | `bskyweb/static/.well-known/apple-app-site-association` | `com.sheersky.app` |
| | `src/screens/NotificationSettings/index.tsx` | `com.sheersky.app` |
| | `src/screens/StarterPack/StarterPackLandingScreen.tsx` | `com.sheersky.app` |
| | `src/lib/notifications/notifications.ts` | `com.sheersky.app` |
| | `__e2e__/setupApp.yml` | `com.sheersky.app` |
| | `__e2e__/perf-test.yml` | `com.sheersky.app` |
| | `__e2e__/flows/*.yaml` | `com.sheersky.app` |
| | `package.json` (perf:test:measure script) | `com.sheersky.app` |
| Associated domains | `app.config.js` (lines 25-32) | `applinks:sheersky.app` or remove |
| Android intent filters | `app.config.js` (lines 193-212) | `sheersky.app` or remove |
| App Store ID `6444370199` | `bskyweb/cmd/bskyweb/server.go` | New App Store ID |
| | `eas.json` (`ascAppId`) | New App Store ID |
| App Store link | `bskyweb/cmd/bskyweb/server.go` | New App Store URL |
| AppClip appID | `bskylink/src/routes/siteAssociation.ts` | New Team ID + `com.sheersky.app.AppClip` |
| Expo Project ID | `app.config.js` (line 447) | New Expo project ID from `eas init` |

### 2B. Important — Not Blocking First Build

| What | Where | Action |
|------|-------|--------|
| OTA update URL | `app.config.js` (line 218) | Set `enabled: false` for now (disable OTA updates) |
| OTA deploy script | `scripts/bundleUpdate.sh` | Leave as-is (won't be used with OTA disabled) |
| Code signing cert | `code-signing/certificate.pem` | Generate new (only needed if enabling OTA later) |
| CI repo check | `.github/workflows/*.yml` | Change `bluesky-social/social-app` → your repo |
| Firebase config | `google-services.json` | Replace with your Firebase project config |
| Sentry org/project | `app.config.js` (lines 245-246) | Remove or set up free Sentry project |
| Android module package | `modules/expo-receive-android-intents/.../xyz/blueskyweb/app/` | Rename Java package path |
| Module names | `modules/expo-bluesky-gif-view/`, `modules/expo-bluesky-swiss-army/` | Cosmetic — consider renaming later |
| Short link service | `src/state/queries/shorten-link.ts`, `resolve-short-link.ts` | Uses `go.bsky.app` — disable or leave (still works) |
| Web preconnect | `web/index.html:17`, `bskyweb/templates/base.html:10` | Remove `go.bsky.app` preconnect |
| `.env` file | `.env` | Create from `.env.example`, fill SheerSky values or leave blank |

### 2C. App Store Connect API Key (for EAS Submit)

Add to `eas.json` under `submit.production.ios`:
```json
{
  "ascApiKeyPath": "./path-to-your-key.p8",
  "ascApiKeyIssuerId": "your-issuer-id",
  "ascApiKeyId": "your-key-id"
}
```

Add to `eas.json` under `submit.production.android`:
```json
{
  "serviceAccountKeyPath": "./path-to-google-service-account.json"
}
```

---

## Phase 3: First Builds

### 3A. Development Build (Test on Simulator/Device)

```bash
# iOS simulator build
eas build --platform ios --profile development

# Android emulator build
eas build --platform android --profile development
```

On first iOS build, EAS will prompt you to sign in with your Apple Developer account and auto-generate certificates. Say yes to auto-managed credentials.

On first Android build, EAS auto-generates and stores the Android keystore.

### 3B. Preview Build (Installable on Real Devices)

```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

Preview builds produce installable artifacts:
- iOS: `.ipa` file (install via Xcode or Apple Configurator)
- Android: `.apk` file (install directly on device)

### 3C. Production Build (For Store Submission)

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

- iOS: Produces `.ipa` signed for App Store distribution
- Android: Produces `.aab` (Android App Bundle) for Play Store

---

## Phase 4: TestFlight & Internal Testing

### 4A. iOS TestFlight

**Submit to TestFlight:**
```bash
eas submit --platform ios --profile production
```

This uploads to App Store Connect. Then:

1. Wait for build processing (~10-30 minutes, Apple runs automated checks)
2. Fill out "Test Information" in App Store Connect > TestFlight:
   - What to test (describe key features)
   - Feedback email
   - Privacy policy URL (can use in-app page URL for now)
3. **Internal testers** (up to 100): Available immediately after processing. Add testers in App Store Connect > Users and Access.
4. **External testers** (up to 10,000): Requires a one-time Beta App Review (~24-48 hours). Share via email invite or public TestFlight link.

Builds expire after 90 days.

### 4B. Google Play Internal Testing

**First time — manual upload required:**

1. Go to Play Console > Your app > Testing > Internal testing
2. Click "Create new release"
3. Upload the `.aab` file from the EAS build
4. Fill out the store listing (minimum required fields)
5. Create an email list of testers (Testers tab)
6. Share the opt-in link with testers

**Subsequent builds** can use EAS Submit:
```bash
eas submit --platform android --profile production
```

Internal testing track: No Google review, builds available within minutes. Up to 100 testers.

**Testing tracks progression:**
| Track | Testers | Review? | Timeline |
|-------|---------|---------|----------|
| Internal | Up to 100 | No | Minutes |
| Closed | Unlimited (by email) | Yes | 1-3 days |
| Open | Anyone with link | Yes | 1-3 days |
| Production | Everyone | Yes | 1-7 days |

---

## Phase 5: Store Listing Preparation

### 5A. Required for Both Stores

- [ ] **Privacy Policy URL** — must be publicly accessible. Can host on `sheersky.app/privacy` or use a hosted page.
- [ ] **App Description** — emphasize it's a third-party AT Protocol client with unique features (soft block, code blocks, hide reposts, etc.)
- [ ] **App Icon** — 1024x1024 PNG (already generated via Expo)
- [ ] **Screenshots** — see sizes below

### 5B. Apple App Store Requirements

| Asset | Spec |
|-------|------|
| App icon | 1024x1024 PNG, no transparency, no rounded corners |
| Screenshots (iPhone 6.9") | 1320x2868, minimum 1, max 10 |
| Screenshots (iPad 13") | 2064x2752 (if supporting iPad) |
| App name | Up to 30 characters |
| Subtitle | Up to 30 characters |
| Description | Up to 4,000 characters |
| Keywords | Up to 100 characters |
| Category | Social Networking |
| Age rating | Complete questionnaire (2026 updated version required) |
| Content rights | Declaration that you have rights to use the content |
| Privacy policy URL | Required |
| Support URL | Required |

**Apple Review Considerations for Third-Party Social Clients:**
- **Guideline 4.2 (Minimum Functionality):** Must clearly differentiate from official Bluesky app. SheerSky's unique features (soft block, code blocks, hide reposts, blocked-me feed, dedup reposts) provide strong differentiation.
- **Guideline 1.2 (User Generated Content):** Must include: report mechanism (already have via AT Protocol moderation), block users (already have), content filtering (already have via labeling system).
- **Guideline 5.1 (Privacy):** Complete Apple's privacy nutrition labels honestly.
- **Review timeline:** Typically 24-48 hours. Rejections add 24-72 hours per resubmission cycle.

### 5C. Google Play Requirements

| Asset | Spec |
|-------|------|
| App icon | 512x512 PNG |
| Feature graphic | 1024x500 PNG/JPEG (mandatory) |
| Screenshots (phone) | Min 2, max 8 |
| App title | Up to 50 characters |
| Short description | Up to 80 characters |
| Full description | Up to 4,000 characters |
| Content rating | Complete IARC questionnaire |
| Data safety section | Declare all data collection |
| Privacy policy URL | Required |
| Target audience | Declare target age group |

**Google Play Review Timeline:** New app 1-7 days (typically 1-3).

---

## Phase 6: Production Release

### 6A. Apple App Store Submission

1. In App Store Connect, go to your app > App Store tab
2. Fill out all metadata (description, keywords, screenshots, etc.)
3. Select the TestFlight build to submit
4. Answer the export compliance question (uses HTTPS = yes, exempt = yes for standard encryption)
5. Submit for review
6. Wait 24-48 hours
7. If approved, choose release option: manual or automatic

### 6B. Google Play Production Release

1. In Play Console, go to Production > Create new release
2. Upload AAB or promote from internal/closed testing
3. Ensure all store listing fields are complete
4. Submit for review
5. Wait 1-7 days
6. If approved, rollout begins (can do staged rollout: 5% → 20% → 50% → 100%)

---

## Recommended Order of Operations

Here's the sequence that minimizes blocking/waiting time:

### Week 1: Accounts
- [ ] Enroll in Apple Developer Program ($99) — up to 48hr wait
- [ ] Register for Google Play Console ($25) — 2-5 day wait
- [ ] Create Expo account + run `eas init`
- [ ] Register domain `sheersky.app`
- [ ] Create Firebase project, download config files

### Week 2: Code Changes (after Apple approval)
- [ ] Note Team ID and create App Store Connect listing
- [ ] Make all critical code changes (Phase 2A) in a single commit
- [ ] Make important code changes (Phase 2B)
- [ ] Disable OTA updates (`enabled: false`)
- [ ] Replace `google-services.json` with real Firebase config
- [ ] Set up `.env` file
- [ ] Host `apple-app-site-association` and `assetlinks.json` on domain

### Week 3: Build & Test
- [ ] Run development build (`eas build --profile development`)
- [ ] Fix any build errors
- [ ] Run preview build for device testing
- [ ] Test all items from Bug Bash checklist (see below)
- [ ] Run production build
- [ ] Submit to TestFlight + Play Store internal testing
- [ ] Recruit beta testers, gather feedback

### Week 4: Store Submission
- [ ] Create screenshots (iPhone, optionally iPad)
- [ ] Create feature graphic (Android)
- [ ] Write store descriptions
- [ ] Complete privacy questionnaires on both platforms
- [ ] Submit to App Store and Play Store
- [ ] Address any review feedback/rejections

---

## Bug Bash / QA Checklist

Test on **at least one real iOS device, one Android device, and web browser**.

### Core Functionality
- [ ] Login/signup flow
- [ ] Profile viewing and editing
- [ ] Post creation (text, images, video)
- [ ] Feed browsing (home, following, discover)
- [ ] Notifications
- [ ] Direct messages
- [ ] Search (posts, users, feeds)

### SheerSky-Specific Features
- [ ] Code blocks (triple backtick rendering, copy button, inline code)
- [ ] Soft block (view posts from users who blocked you)
- [ ] Blocked-me feed (home tab)
- [ ] Hide reposts per account (profile menu toggle)
- [ ] Dedup reposts (following feed)
- [ ] Feed position memory

### Visual Rebrand
- [ ] Logo and logotype render correctly everywhere
- [ ] Light theme colors correct
- [ ] Dark theme colors correct
- [ ] Dim theme colors correct
- [ ] Tab bar active states use primary_500 (Sky Cyan)
- [ ] Borders visible in all themes

### Platform-Specific
- [ ] Deep links (`sheersky://intent/compose`)
- [ ] Share extension (Share-with-SheerSky)
- [ ] Push notifications
- [ ] App clip (or verify it's removed)
- [ ] Universal links (if domain configured)

### Legal & Settings
- [ ] In-app Terms of Service page
- [ ] In-app Privacy Policy page
- [ ] In-app Community Guidelines page
- [ ] In-app Copyright page
- [ ] In-app Support page
- [ ] Feedback composer opens correctly
- [ ] All settings screens functional

---

## Post-Launch Roadmap

| Item | Priority | Notes |
|------|----------|-------|
| OTA updates (EAS Update) | Medium | Enable after first stable release, generate code signing cert |
| Sentry error reporting | Medium | Free tier: 5K errors/mo. Set up project, add DSN to `.env` |
| Web deployment | Medium | Deploy to `sheersky.app` via Cloudflare Pages or similar |
| Short link service | Low | Replace `go.bsky.app` with own service, or leave (still works) |
| CI/CD pipelines | Low | Update GitHub Actions workflows for automated builds |
| App Clip | Low | Update or remove — low priority feature |
| Tauri desktop app | Future | Phase 3 from project plan |
| Own PDS/infrastructure | Future | Phase 4 from project plan |
