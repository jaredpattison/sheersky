# iPad / Tablet Layout

**GitHub Issue:** [#6318](https://github.com/bluesky-social/social-app/issues/6318)
**Upvotes:** 68
**Category:** Feature — Layout / Platform
**Effort:** High
**Scope:** Client-side only

## Problem

The app uses a phone-optimized single-column layout on all devices. On iPad and tablets, the UI is just a stretched phone layout with excessive whitespace, making poor use of the larger screen.

## Expected Behavior

- On tablets (iPad, Android tablets), show a multi-pane layout:
  - Left sidebar: navigation (Home, Search, Notifications, Profile, Settings)
  - Center: main content (feed, thread, profile)
  - Right sidebar (optional): trending, who to follow, compose quick post
- Existing web breakpoint system (`gtTablet`) should be leveraged
- Split-view / slide-over on iPad should adapt gracefully

## Key Files

| File | Purpose |
|------|---------|
| `src/view/shell/` | App shell — tab bar, headers, navigation structure |
| `src/view/shell/bottom-bar/BottomBar.tsx` | Bottom tab bar (native) — would become a side rail on tablet |
| `src/alf/` | ALF design system — breakpoints via `useBreakpoints()` |
| `src/Navigation.tsx` | Navigation config — may need a different navigator structure for tablets |

## Implementation Approach

### 1. Detect Tablet

```ts
import { useBreakpoints } from '#/alf'
const { gtTablet } = useBreakpoints()

// Or use screen dimensions
const { width } = useWindowDimensions()
const isTablet = width >= 768
```

### 2. Shell Layout

On tablet, replace the bottom tab bar with a left sidebar:

```tsx
function AppShell() {
  const { gtTablet } = useBreakpoints()

  if (gtTablet) {
    return (
      <View style={a.flex_row}>
        <SideNavigation />
        <View style={a.flex_1}>
          <MainContent />
        </View>
        <RightSidebar />  {/* optional */}
      </View>
    )
  }

  return (
    <View>
      <MainContent />
      <BottomTabBar />
    </View>
  )
}
```

### 3. Content Width

Constrain content to a readable max-width on large screens (the web version already does this via `maxWidth` on content areas):

```tsx
const contentStyle = gtTablet ? { maxWidth: 600, alignSelf: 'center' } : {}
```

### 4. Side Navigation

Convert the bottom bar items to a vertical sidebar with labels:

```tsx
function SideNavigation() {
  return (
    <View style={[styles.sidebar, { width: 240 }]}>
      <NavItem icon={HomeIcon} label="Home" route="Home" />
      <NavItem icon={SearchIcon} label="Search" route="Search" />
      <NavItem icon={BellIcon} label="Notifications" route="Notifications" />
      <NavItem icon={UserIcon} label="Profile" route="Profile" />
      <ComposeButton />
    </View>
  )
}
```

## Edge Cases

- iPad split-view: app may be in a narrow window — fall back to phone layout
- Orientation changes: re-evaluate layout on rotation
- Navigation: drawer-style navigation vs side rail — choose based on width
- Dialogs/sheets: bottom sheets may need to be centered modals on tablet
- Keyboard shortcuts: tablet with physical keyboard should support keyboard shortcuts too
- Performance: rendering three columns simultaneously needs optimization
