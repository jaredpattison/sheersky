# Thread Collapsing

**GitHub Issue:** [#1547](https://github.com/bluesky-social/social-app/issues/1547)
**Upvotes:** 50
**Category:** Feature — Thread UX
**Effort:** Medium
**Scope:** Client-side only

## Problem

Long threads with many replies are difficult to navigate. Users want Reddit-style collapse/expand for reply branches so they can skip conversations they're not interested in.

## Expected Behavior

- Each reply in a thread has a collapse indicator (tap the reply line/avatar to collapse)
- Collapsing a reply hides all its child replies
- A "collapsed" indicator shows how many replies are hidden (e.g., "3 more replies")
- Tap to expand again
- Collapse state is ephemeral (resets on navigation away)

## Key Files

| File | Purpose |
|------|---------|
| `src/screens/PostThread/index.tsx` | Thread screen — fetches and renders the thread tree |
| `src/screens/PostThread/PostThreadItem.tsx` | Individual reply/post item in thread |
| `src/state/queries/post-thread.ts` | Thread data fetching — returns nested `ThreadNode` structure |
| `src/lib/api/build-thread-tree.ts` | Builds the tree structure from flat API response |

## Implementation Approach

### 1. Collapse State

Track collapsed node URIs in component state:

```ts
const [collapsedUris, setCollapsedUris] = useState<Set<string>>(new Set())

const toggleCollapse = (uri: string) => {
  setCollapsedUris(prev => {
    const next = new Set(prev)
    if (next.has(uri)) next.delete(uri)
    else next.add(uri)
    return next
  })
}
```

### 2. Thread Tree Rendering

When flattening the tree for rendering, skip children of collapsed nodes:

```ts
function flattenThread(node: ThreadNode, collapsedUris: Set<string>): FlatItem[] {
  const items: FlatItem[] = [{ type: 'post', node }]

  if (collapsedUris.has(node.post.uri)) {
    const childCount = countDescendants(node)
    items.push({ type: 'collapsed-indicator', count: childCount, uri: node.post.uri })
    return items
  }

  for (const child of node.replies) {
    items.push(...flattenThread(child, collapsedUris))
  }
  return items
}
```

### 3. UI

- Collapse toggle: tap on the vertical thread line (the connecting line between replies) or add a small collapse button
- Collapsed indicator: render a small pill showing "N replies hidden — tap to expand"
- Visual: dimmed/condensed style for the collapsed indicator row

## Edge Cases

- Root post: cannot be collapsed (it's the anchor)
- Deeply nested threads: collapse at any level should hide the entire subtree
- "Show more" pagination: collapsing should work independently of load-more boundaries
- Thread navigation from notifications: highlighted reply should auto-expand its parent chain
