# SheerSky Release Plan

## Strategy: iOS-First

Release on Apple App Store first. If there's user traction, proceed to Google Play.
Android and web deployment deferred until post-launch.

---

## Current State

**Done:**
- App name, slug, scheme → "SheerSky" / "sheersky"
- Bundle IDs in `app.config.js` → `com.sheersky.space` (iOS + Android)
- Visual rebrand (colors, logo, logotype, tab bar, borders)
- In-app legal pages (Terms, Privacy, Community Guidelines, Copyright, Support)
- Centralized URLs in `webLinks` object
- Sidebar/drawer links → in-app routes
- Feedback → composer mentioning `@devagent.bsky.social`
- Analytics/telemetry disabled (metrics, feature flags, Sentry)
- CSS hardcoded colors updated
- Embed page titles/meta → "SheerSky"
- App group entitlement → `group.com.sheersky.space` (in app.config.js)
- Share extension → `Share-with-SheerSky` (bundle: `com.sheersky.space.Share-with-SheerSky`)
- Notification extension → `SheerSkyNSE` (bundle: `com.sheersky.space.SheerSkyNSE`)
- App Clip → `SheerSkyClip` (bundle: `com.sheersky.space.AppClip`)
- App group `group.app.bsky` → `group.com.sheersky.space` (all modules + plugins — 13 files)
- Deep link scheme `bluesky` → `sheersky` (module Info.plists + Swift fallbacks)
- NSE display name `Bluesky Notifications` → `SheerSky Notifications` (module + plugin)
- Export compliance: `ITSAppUsesNonExemptEncryption: false` already in Info.plist
- Privacy manifest: `PrivacyInfo.xcprivacy` configured with Required Reason APIs
- Tablet support disabled: `supportsTablet: false` (no iPad screenshots needed)

---

## Cost Summary (iOS-First)

| Item | Cost | Frequency | Required for iOS Launch? |
|------|------|-----------|------------------------|
| Apple Developer Program | $99 | Annual | Yes |
| Expo EAS (Free tier) | $0 | Monthly | Yes — 30 builds/mo (max 15 iOS) |
| Domain (`sheersky.space`) | ~$12-15 | Annual | Yes (privacy policy, universal links) |
| Firebase (FCM) | $0 | Free forever | Yes (push notifications) |
| Sentry (free tier) | $0 | Monthly | No — can add post-launch |
| **Total Year 1** | **~$111-114** | | |

Google Play Console ($25 one-time) deferred until decision to launch on Android.

---

## Phase 1: Accounts & Infrastructure Setup

### 1A. Apple Developer Program ($99/year) — DONE

Personal Apple Developer account enrolled (Individual). Team ID: `8U43G9PFFY`.

**Remaining portal steps:**
- [ ] Register Bundle ID `com.sheersky.space` in Certificates, Identifiers & Profiles
- [ ] Register App Group `group.com.sheersky.space` in Certificates, Identifiers & Profiles
- [ ] Create a new app in App Store Connect:
  - Bundle ID: `com.sheersky.space`
  - App name: "SheerSky"
  - Primary language: English (U.S.)
  - SKU: `com.sheersky.space`
- [ ] Note the new **App Store ID** (numeric, shown in App Store Connect URL)
- [ ] Create App Store Connect API Key (for EAS Submit):
  - App Store Connect > Users and Access > Integrations > App Store Connect API
  - Role: "App Manager" or "Admin"
  - Download the `.p8` file — you only get one download

### 1B. Expo / EAS Account — DONE

- Account: `jaredpattison` on expo.dev
- Project: `@jaredpattison/sheersky`
- Project ID: `1a308a86-dca7-4cbb-b4e6-2c361d5f468f` (set in `app.config.js`)
- Owner: `jaredpattison` (set in `app.config.js`)

**Free tier includes:**
- 30 low-priority builds/month (max 15 iOS)
- EAS Submit (to App Store)
- EAS Update with 1,000 monthly active users

### 1C. Firebase Project (Free)

Needed for push notifications (FCM).

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Add project", name it "SheerSky"
3. **Add iOS app:**
   - Bundle ID: `com.sheersky.space`
   - Download `GoogleService-Info.plist`
   - Place in project root (Expo handles placement during prebuild)

### 1D. Domain Registration — DONE

Domain `sheersky.space` registered on Namecheap ($2.50/yr).

**Separate repo for website:** Create a `sheersky-web` (or `sheersky.space`) repo with:

```
sheersky.space/
├── index.html                                # Landing page (optional, not required for App Store)
├── privacy/index.html                        # Privacy policy (REQUIRED for App Store Connect)
├── support/index.html                        # Support page (REQUIRED for App Store Connect)
├── .well-known/
│   └── apple-app-site-association            # Universal links (JSON, no file extension)
└── assets/                                   # Logo, favicon, etc.
```

**Hosting: AWS S3 + CloudFront**

1. **Create S3 bucket** (any name, e.g., `sheersky-app-web`)
   - Enable static website hosting
2. **Create CloudFront distribution:**
   - Origin: S3 bucket (use S3 website endpoint, NOT the REST API endpoint)
   - Alternate domain: `sheersky.space`
   - SSL certificate: Request in ACM (**us-east-1 region**) for `sheersky.space`
   - Default root object: `index.html`
   - **Important:** For `.well-known/apple-app-site-association`, set `Content-Type: application/json` in S3 metadata (Apple requires this, no file extension)
3. **DNS in Namecheap:**
   - For apex domain (`sheersky.space`): CNAME won't work at apex — either:
     - Transfer DNS to Route 53 for native ALIAS record, OR
     - Use Namecheap's URL redirect to `www.sheersky.space` + CNAME `www` → CloudFront
   - Simplest: use Route 53 for DNS ($0.50/mo per hosted zone)
4. **Deploy:** `aws s3 sync ./build s3://your-bucket --delete`

**What you need before App Store submission:**
- Privacy Policy URL: `https://sheersky.space/privacy`
- Support URL: `https://sheersky.space/support`
- A landing page is NOT required — Apple doesn't review it
- You can also use the GitHub repo URL as the support URL initially

**apple-app-site-association file content:**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "8U43G9PFFY.com.sheersky.space",
        "paths": ["*"]
      }
    ]
  },
  "appclips": {
    "apps": ["8U43G9PFFY.com.sheersky.space.AppClip"]
  }
}
```

---

## Phase 2: Code Changes

### 2A. Already Done (This Session)

| What | Status |
|------|--------|
| App group → `group.com.sheersky.space` (13 files) | DONE |
| Deep link scheme → `sheersky` (3 files) | DONE |
| NSE display name → `SheerSky Notifications` | DONE |
| Privacy manifest, export compliance | Already configured |

### 2B. Team ID — DONE

Team ID `8U43G9PFFY` applied to all files:
- `plugins/shareExtension/withXcodeTarget.js` (3 occurrences)
- `plugins/notificationsExtension/withXcodeTarget.js` (3 occurrences)
- `plugins/starterPackAppClipExtension/withXcodeTarget.js` (2 occurrences)
- `bskylink/src/routes/siteAssociation.ts` (appID + appClip)
- `bskyweb/static/.well-known/apple-app-site-association` (appID + appClip)

### 2C. Needs App Store ID — Do After Creating App in App Store Connect

| What | Where | Change to |
|------|-------|-----------|
| App Store ID `6444370199` | `eas.json` (`ascAppId`) | New App Store ID |
| | `bskyweb/cmd/bskyweb/server.go` | New App Store ID |
| StarterPack meta tag | `src/screens/StarterPack/StarterPackLandingScreen.tsx:367` | `app-id=NEW_ID, app-clip-bundle-id=com.sheersky.space.AppClip` |

### 2D. Needs Domain — Do After Domain Is Configured

| What | Where | Change to |
|------|-------|-----------|
| Associated domains | `app.config.js` (lines 25-32) | `applinks:sheersky.space` |
| Android intent filters | `app.config.js` (lines 193-212) | `sheersky.space` (defer, Android later) |

### 2E. Expo Project — DONE

- Project ID `1a308a86-dca7-4cbb-b4e6-2c361d5f468f` set in `app.config.js`
- Owner changed from `sheersky` to `jaredpattison` in `app.config.js`

### 2F. Important — Not Blocking First Build

| What | Where | Action |
|------|-------|--------|
| OTA update URL | `app.config.js` (line 218) | Set `enabled: false` for now |
| Firebase config | `google-services.json` | Replace with your Firebase project config |
| Sentry org/project | `app.config.js` (lines 245-246) | Remove or set up free Sentry project |
| `.env` file | `.env` | Create from `.env.example`, fill SheerSky values or leave blank |

### 2G. Known Issues — Push Notifications

The `appId` field in `src/lib/notifications/notifications.ts` (lines 45, 311) is set to `xyz.blueskyweb.app`. This is the identifier registered with Bluesky's push notification service, NOT the bundle ID. Changing it to `com.sheersky.space` would break push notifications because Bluesky's server doesn't know about SheerSky.

**Options:**
1. Leave as-is — push notifications may work if Bluesky's service doesn't validate the appId against the sender
2. Set up your own notification relay service (more complex, post-launch)
3. Contact Bluesky about registering the new appId (unlikely to succeed)
4. Accept that push notifications may not work initially — the app still shows notifications when opened

Test this during TestFlight to determine which option is needed.

### 2H. App Store Connect API Key (for EAS Submit)

Add to `eas.json` under `submit.production.ios`:
```json
{
  "ascApiKeyPath": "./path-to-your-key.p8",
  "ascApiKeyIssuerId": "your-issuer-id",
  "ascApiKeyId": "your-key-id"
}
```

---

## Phase 3: First iOS Build

### 3A. Development Build (Test on Simulator/Device)

```bash
eas build --platform ios --profile development
```

On first iOS build, EAS will prompt you to sign in with your Apple Developer account and auto-generate certificates. Say yes to auto-managed credentials.

### 3B. Preview Build (Installable on Real Devices)

```bash
eas build --platform ios --profile preview
```

Produces `.ipa` file (install via Xcode or Apple Configurator).

### 3C. Production Build (For Store Submission)

```bash
eas build --platform ios --profile production
```

Produces `.ipa` signed for App Store distribution.

---

## Phase 4: TestFlight

**Submit to TestFlight:**
```bash
eas submit --platform ios --profile production
```

This uploads to App Store Connect. Then:

1. Wait for build processing (~10-30 minutes, Apple runs automated checks)
2. Fill out "Test Information" in App Store Connect > TestFlight:
   - What to test (describe key features)
   - Feedback email
   - Privacy policy URL
3. **Internal testers** (up to 100): Available immediately after processing
4. **External testers** (up to 10,000): Requires a one-time Beta App Review (~24-48 hours)

Builds expire after 90 days.

---

## Phase 5: App Store Listing Preparation

### 5A. Required Metadata

- [ ] **App name:** "SheerSky" (up to 30 characters)
- [ ] **Subtitle:** e.g., "AT Protocol Social Client" (up to 30 characters)
- [ ] **Description:** Up to 4,000 characters — emphasize unique features, differentiation from official app
- [ ] **Keywords:** Up to 100 characters — e.g., "bluesky,atprotocol,social,decentralized,code,blocks"
- [ ] **Category:** Social Networking
- [ ] **Privacy Policy URL:** `https://sheersky.space/privacy` (must be publicly accessible)
- [ ] **Support URL:** `https://sheersky.space/support` (or GitHub repo URL)
- [ ] **Copyright:** "2026 Jared Pattison" (or your preferred name)

### 5B. Required Assets

| Asset | Spec |
|-------|------|
| App icon | 1024x1024 PNG, no transparency, no rounded corners (Expo generates this) |
| Screenshots (iPhone 6.9") | 1320x2868 px, minimum 1, max 10 |

**Note:** iPad screenshots not needed since `supportsTablet: false`.

**Screenshot strategy:** Take 5-6 screenshots showcasing:
1. Home feed (shows SheerSky branding, theme)
2. Code blocks in a post (unique feature)
3. Blocked-me feed tab (unique feature)
4. Hide reposts menu (unique feature)
5. Dark/dim theme (visual differentiation)
6. Profile view

### 5C. Privacy Nutrition Labels (App Store Connect)

Declare in App Store Connect under "App Privacy":

**Data Linked to You:**
| Data Type | Purpose |
|-----------|---------|
| Email Address | Account creation, authentication |
| User ID (DID) | App functionality |
| Other User Content (posts, messages) | App functionality |
| Photos or Videos | User uploads |

**Data Not Linked to You:**
| Data Type | Purpose |
|-----------|---------|
| Crash Data | App diagnostics |
| Performance Data | App diagnostics |

**Tracking:** No

### 5D. Age Rating Questionnaire

Apple updated the age rating system in 2025. New tiers: 4+, 9+, 13+, 16+, 18+.

For SheerSky (social media with UGC), answer:
- User-generated content: **Yes**
- Social features: **Yes**
- Web browsing: **Yes** (via in-app browser)
- Violence/sexual content/profanity: **Infrequent/mild** (user-generated, moderated)

Expected rating: **13+** or **16+**

### 5E. Export Compliance

Already handled via `ITSAppUsesNonExemptEncryption: false` in Info.plist. On first submission, confirm:
- App uses encryption: Yes (HTTPS)
- Exempt under Category 5, Part 2: Yes (standard encryption for authentication)

### 5F. Test Account for Apple Review

**This is critical — Apple will reject without it.**

Create a dedicated test account on bsky.social:
- [ ] Create account (e.g., `sheersky-review.bsky.social`)
- [ ] Populate with sample posts (including code blocks to showcase)
- [ ] Follow some accounts so feeds have content
- [ ] Provide credentials in App Store Connect review notes

---

## Phase 6: Apple App Store Submission

### 6A. Avoiding Guideline 4.2 (Copycat) Rejection

This is the highest risk for a third-party client. See `docs/differentiation-ideas.md` for full strategy.

**Key mitigations:**
1. **Distinct visual identity** — teal/cyan palette, mountain logo (already done)
2. **Unique features visible within 30 seconds** — Blocked-Me feed tab is immediately visible on home screen
3. **Thorough review notes** — explain differentiation, list unique features with navigation steps
4. **AT Protocol is open by design** — Bluesky explicitly encourages third-party clients

### 6B. Review Notes Template

Provide these in App Store Connect > App Review Information > Notes:

```
SheerSky is a third-party client for the AT Protocol social network (Bluesky).
AT Protocol is an open, federated protocol that explicitly encourages third-party
clients — see https://docs.bsky.app/docs/starter-templates/clients

UNIQUE FEATURES (not in the official Bluesky app):
1. Soft Block Transparency — View posts from users who blocked you (public API)
2. Blocked-By Feed — Dedicated home tab aggregating posts from blockers
3. Code Block Rendering — Triple-backtick fenced code with monospace, copy button
4. Per-Account Repost Hiding — Hide reposts from specific accounts
5. Repost Deduplication — Auto-removes duplicate reposts in feeds
6. Biometric App Lock — Face ID / Touch ID protection
7. Secure Keychain Storage — Custom native module for credential security

VISUAL IDENTITY:
- Unique teal/cyan color palette (#0284C7) vs Bluesky's blue (#006AFF)
- Mountain peak logo and "SheerSky" logotype
- Custom dark/dim themes with teal-tinted grays

TO TEST UNIQUE FEATURES:
- Blocked-By Feed: Home screen > swipe to "Blocked By" tab
- Code Blocks: View any post containing triple-backtick markdown
- Hide Reposts: Profile > three-dot menu > "Hide reposts from [user]"
- App Lock: Settings > Privacy & Security > App Lock

TEST ACCOUNT: [username] / [password]
```

### 6C. Submission Steps

1. In App Store Connect, go to your app > App Store tab
2. Fill out all metadata (description, keywords, screenshots, etc.)
3. Select the TestFlight build to submit
4. Submit for review
5. Wait 24-48 hours (first-time submissions may take up to 72 hours)
6. If approved, choose release option: manual or automatic

---

## Recommended Order of Operations (iOS-First)

### Week 1: Setup & Code Changes
- [x] Apple Developer account enrolled
- [ ] Get Team ID from developer.apple.com
- [ ] Register bundle ID + app group in Apple Developer portal
- [ ] Create App Store Connect app record
- [ ] Register `sheersky.space` on Namecheap
- [ ] Set up S3 bucket + CloudFront for domain
- [ ] Create Expo account + run `eas init`
- [ ] Create Firebase project, download `GoogleService-Info.plist`
- [ ] Make Team ID code changes (Phase 2B) — single commit
- [ ] Make App Store ID + domain changes (Phase 2C, 2D)
- [ ] Disable OTA updates

### Week 2: Build & Test
- [ ] Run development build (`eas build --platform ios --profile development`)
- [ ] Fix any build errors
- [ ] Run preview build for device testing
- [ ] Full bug bash (see checklist below)
- [ ] Run production build
- [ ] Submit to TestFlight
- [ ] Test push notifications — determine if they work with SheerSky bundle ID

### Week 3: Store Submission
- [ ] Upload privacy policy + support pages to S3/CloudFront
- [ ] Create App Store screenshots
- [ ] Write app description and keywords
- [ ] Complete privacy nutrition labels
- [ ] Complete age rating questionnaire
- [ ] Create test account with sample content
- [ ] Submit to App Store for review
- [ ] Address any review feedback/rejections

---

## Bug Bash / QA Checklist

Test on **at least one real iOS device**.

### Core Functionality
- [ ] Login/signup flow
- [ ] Profile viewing and editing
- [ ] Post creation (text, images, video)
- [ ] Feed browsing (home, following, discover)
- [ ] Notifications
- [ ] Direct messages
- [ ] Search (posts, users, feeds)
- [ ] Account deletion flow (Apple tests this)
- [ ] Content reporting (Apple tests this for UGC apps)

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
- [ ] No "Bluesky" text visible anywhere in the UI

### Platform-Specific (iOS)
- [ ] Deep links (`sheersky://intent/compose`)
- [ ] Share extension (Share-with-SheerSky)
- [ ] Push notifications (test if they work)
- [ ] Cold start — no crash, loads within 3 seconds
- [ ] Background/foreground transitions
- [ ] Dark mode system setting respected

### Apple Review Preparedness
- [ ] Test account works and has content
- [ ] Privacy policy URL loads correctly
- [ ] Support URL loads correctly
- [ ] All settings screens functional
- [ ] VoiceOver works on key screens (Apple sometimes tests)
- [ ] No crashes or ANRs
- [ ] Network error states handled gracefully (airplane mode test)
- [ ] Age gate blocks under-13 signup
- [ ] Adult content toggle disabled for under-18 on iOS

### Legal & Settings
- [ ] In-app Terms of Service page
- [ ] In-app Privacy Policy page
- [ ] In-app Community Guidelines page
- [ ] In-app Copyright page
- [ ] In-app Support page
- [ ] Feedback composer opens correctly

---

## Post-Launch Roadmap

| Item | Priority | Notes |
|------|----------|-------|
| Push notification fix | High | Test during TestFlight; may need own relay service |
| OTA updates (EAS Update) | Medium | Enable after first stable release |
| Sentry error reporting | Medium | Free tier: 5K errors/mo |
| Google Play launch | Medium | Only if iOS shows traction |
| Web deployment | Medium | Deploy to `sheersky.space` |
| Differentiation features | Medium | See `docs/differentiation-ideas.md` |
| CI/CD pipelines | Low | Update GitHub Actions for automated builds |
| App Clip | Low | Update or remove |
| Tauri desktop app | Future | Phase 3 from project plan |
| Own PDS/infrastructure | Future | Phase 4 from project plan |
