# Spoiler Tags

**GitHub Issue:** [#5840](https://github.com/bluesky-social/social-app/issues/5840)
**Upvotes:** 43
**Category:** Feature — Post Content
**Effort:** Medium
**Scope:** Client-side only (display-side convention)

## Problem

Users want to hide spoilers, sensitive text, or punchlines behind a tap-to-reveal mechanism. Currently there is no way to mark portions of a post as spoiler text.

## Expected Behavior

- Text wrapped in `||spoiler text here||` (Discord convention) is rendered as a blurred/hidden block
- Tapping the spoiler block reveals the text
- In the composer, users can wrap selected text in `||` markers via a toolbar button
- Other Bluesky clients that don't support this will show the raw `||` markers (graceful fallback)

## Key Files

| File | Purpose |
|------|---------|
| `src/components/RichText.tsx` | Rich text renderer — currently handles mentions, links, and hashtag facets. Spoiler rendering would be added here |
| `src/view/com/composer/Composer.tsx` | Post composer — add spoiler toolbar button |
| `src/view/com/composer/text-input/` | Text input component — handle inserting `||` markers |

## Implementation Approach

### 1. Detection

In the rich text renderer, detect `||...||` patterns:

```ts
// After processing AT Protocol facets, scan remaining text for spoiler markers
const spoilerRegex = /\|\|(.+?)\|\|/gs

// Split text segments by spoiler markers and render accordingly
```

### 2. Rendering

```tsx
// Spoiler component
function SpoilerText({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <Pressable onPress={() => setRevealed(true)}>
      <Text style={revealed ? styles.text : styles.spoiler}>
        {text}
      </Text>
    </Pressable>
  )
}

// Blurred state: dark background with "Tap to reveal" or just a solid bar
// Revealed state: normal text rendering
```

### 3. Composer Integration

Add a spoiler button to the composer toolbar that wraps selected text in `||`:

```ts
const wrapInSpoiler = () => {
  const { selectionStart, selectionEnd } = textInput
  const selected = text.slice(selectionStart, selectionEnd)
  const newText = text.slice(0, selectionStart) + '||' + selected + '||' + text.slice(selectionEnd)
  setText(newText)
}
```

## Edge Cases

- Nested spoilers: `||||text||||` — treat as a single spoiler
- Spoilers spanning facets: a spoiler containing a link or mention — render the facet normally after reveal
- Multi-line spoilers: `||` can span multiple lines
- Empty spoilers: `||||` — ignore, render as literal `||`
- Character count: `||` markers count toward the 300-character limit
- Notification previews: spoiler text should remain hidden in notification snippets
