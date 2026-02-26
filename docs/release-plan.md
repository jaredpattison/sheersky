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

---

## 1. Remaining Code Changes

### Critical (will break builds)

| What | Where | Change to |
|------|-------|-----------|
| Apple Team ID `B3LX46C5HS` | `plugins/shareExtension/withXcodeTarget.js` | New team ID |
| | `plugins/notificationsExtension/withXcodeTarget.js` | New team ID |
| | `plugins/starterPackAppClipExtension/withXcodeTarget.js` | New team ID |
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
| | `modules/expo-receive-android-intents/android/src/main/java/xyz/blueskyweb/app/exporeceiveandroidintents/ExpoReceiveAndroidIntentsModule.kt` (3 occurrences) | `sheersky://` |
| Bundle ID `xyz.blueskyweb.app` | `bskylink/src/routes/siteAssociation.ts` | `com.sheersky.app` |
| | `bskyweb/static/.well-known/apple-app-site-association` | `com.sheersky.app` |
| | `src/screens/NotificationSettings/index.tsx` | `com.sheersky.app` |
| | `src/screens/StarterPack/StarterPackLandingScreen.tsx` | `com.sheersky.app` |
| | `src/lib/notifications/notifications.ts` | `com.sheersky.app` |
| | `__e2e__/setupApp.yml` | `com.sheersky.app` |
| | `__e2e__/perf-test.yml` | `com.sheersky.app` |
| | `__e2e__/flows/*.yaml` | `com.sheersky.app` |
| | `package.json` (perf:test:measure script) | `com.sheersky.app` |
| Associated domains | `app.config.js` (lines 25-32) | SheerSky domains (TBD) or remove |
| App Store ID `6444370199` | `bskyweb/cmd/bskyweb/server.go` | New App Store ID |
| | `eas.json` (ascAppId) | New App Store ID |
| App Store link | `bskyweb/cmd/bskyweb/server.go` | New App Store URL |
| AppClip appID | `bskylink/src/routes/siteAssociation.ts` | New team ID + bundle |

### Important (not blocking first build)

| What | Where | Notes |
|------|-------|-------|
| OTA update URL | `app.config.js` (line 218) | `updates.bsky.app/manifest` → disable or own server |
| OTA deploy script | `scripts/bundleUpdate.sh` | `updates.bsky.app` → own server |
| Code signing cert | `code-signing/certificate.pem` | Generate new for your team |
| CI repo check | `.github/workflows/*.yml` | `bluesky-social/social-app` → your repo |
| Firebase config | `google-services.json` | Need own Firebase project |
| Expo project ID | `app.config.js` (line 447) | `55bd077a-...` → new Expo project |
| Sentry org/project | `app.config.js` (lines 245-246) | Set up own Sentry project or remove |
| Android module package | `modules/expo-receive-android-intents/.../xyz/blueskyweb/app/` | Rename Java package path |
| Module names | `modules/expo-bluesky-gif-view/`, `modules/expo-bluesky-swiss-army/` | Consider renaming |

---

## 2. Bug Bash / QA

- [ ] Test all visual rebrand on iOS, Android, Web
- [ ] Test deep links (`sheersky://intent/compose`)
- [ ] Test share extension (Share-with-SheerSky)
- [ ] Test push notifications
- [ ] Test app clip (or remove it)
- [ ] Test code blocks feature
- [ ] Test soft block / blocked-me feed
- [ ] Test hide reposts (profile toggle + per-account)
- [ ] Test dedup reposts
- [ ] Test feed position memory
- [ ] Test in-app legal pages
- [ ] Test feedback composer
- [ ] Test all settings screens
- [ ] Test light/dark/dim themes
- [ ] Test login/signup flow
- [ ] Test profile editing

---

## 3. Infrastructure

| Item | Priority | Notes |
|------|----------|-------|
| Domain (`sheersky.app`) | High | Needed for universal links, download page, web hosting |
| Firebase project | High | Required for push notifications (FCM) |
| Web hosting | Medium | If deploying web version |
| OTA update server | Medium | Can disable initially, add later |
| Sentry project | Low | Error reporting — can add post-launch |
| Status page | Low | Can keep using `status.bsky.app` initially |

---

## 4. Expo/EAS Account

- [ ] Create Expo account (if not already)
- [ ] Create new Expo project → get project ID
- [ ] Update `app.config.js` with new project ID
- [ ] Set up `EXPO_TOKEN`
- [ ] Configure EAS Build for your signing credentials
- [ ] Run test build: `eas build --profile development`
- [ ] Run preview build: `eas build --profile preview`

---

## 5. App Store Accounts

### Apple Developer Program ($99/year)
- [ ] Enroll at developer.apple.com
- [ ] Get new Team ID → update 3 plugin files
- [ ] Create App Store Connect listing → get new App Store ID
- [ ] Set up provisioning profiles (EAS can auto-manage)
- [ ] Submit TestFlight build
- [ ] Submit for App Store review

### Google Play Console ($25 one-time)
- [ ] Register at play.google.com/console
- [ ] Create app listing for `com.sheersky.app`
- [ ] Set up signing key (or let Google manage)
- [ ] Upload AAB for internal testing
- [ ] Submit for Play Store review

---

## App Store Review Considerations

- **Apple**: Requires privacy policy URL, screenshots, app description, age rating, content rights declaration
- **Google Play**: Requires privacy policy, data safety form, content rating questionnaire, target audience
- **Both**: Since this connects to AT Protocol / Bluesky network, be clear in descriptions that this is a third-party client
- **Both**: Need app icons in required sizes (already generated via Expo)
