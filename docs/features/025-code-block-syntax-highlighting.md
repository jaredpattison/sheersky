# Code Block Syntax Highlighting

**GitHub Issues:** [#5065](https://github.com/bluesky-social/social-app/issues/5065) (79 upvotes), [#5895](https://github.com/bluesky-social/social-app/issues/5895) (77 upvotes)
**Upvotes:** 156 combined
**Category:** Feature — Post Rendering
**Effort:** Medium
**Scope:** Client-side only (display-side)

## Problem

Developers and technical users share code snippets in posts, but they render as plain text with no formatting. Posts with code fences (` ``` `) or inline code (`` ` ``) aren't rendered with any special treatment.

## Expected Behavior

- Text between triple backticks renders in a code block with monospace font and background
- Optional language hint (` ```js `) enables syntax highlighting
- Inline code (`` `code` ``) renders with monospace font and subtle background
- Other Bluesky clients see the raw markdown — graceful fallback

## Key Files

| File | Purpose |
|------|---------|
| `src/components/RichText.tsx` | Rich text renderer — currently processes AT Protocol facets (mentions, links, hashtags). Code block detection would be added here |

## Implementation Approach

### 1. Detection

After processing facets, scan remaining text segments for code patterns:

```ts
// Code fence: ```lang\ncode\n```
const codeFenceRegex = /```(\w*)\n([\s\S]*?)```/g

// Inline code: `code`
const inlineCodeRegex = /`([^`]+)`/g
```

### 2. Code Block Rendering

```tsx
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const t = useTheme()

  return (
    <ScrollView horizontal>
      <View style={[styles.codeBlock, { backgroundColor: t.palette.contrast_25 }]}>
        <Text style={[a.font_mono, a.text_sm]}>
          {language ? highlightSyntax(code, language) : code}
        </Text>
      </View>
    </ScrollView>
  )
}
```

### 3. Syntax Highlighting Library

For web: use a lightweight highlighter like `highlight.js` (core only with select languages) or `shiki`.

For native: either ship a subset of highlight.js or render without colors (just monospace + background) to keep bundle size small.

### 4. Inline Code

```tsx
function InlineCode({ text }: { text: string }) {
  const t = useTheme()
  return (
    <Text style={[a.font_mono, a.text_sm, {
      backgroundColor: t.palette.contrast_50,
      paddingHorizontal: 4,
      borderRadius: 3,
    }]}>
      {text}
    </Text>
  )
}
```

## Edge Cases

- Code blocks with facets: a mention or link inside a code block should render as plain text, not as a clickable link
- Very long code: horizontal scroll for code blocks, not wrapping
- Character count: backticks count toward the 300-character limit
- Copy button: add a "Copy code" button on code blocks
- Language detection: if no language hint, just render plain monospace
- Bundle size: syntax highlighting libraries can be large — use dynamic imports or a minimal subset
- Accessibility: code blocks should be announced as code by screen readers
