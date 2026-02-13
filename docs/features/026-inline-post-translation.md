# Inline Post Translation

**Category:** Feature — Internationalization
**Effort:** Medium
**Scope:** Client-side only

## Problem

Users encounter posts in languages they don't understand. Currently there's no way to translate a post without leaving the app. Third-party clients Graysky and Skeets both offer this feature.

## Expected Behavior

- A "Translate" button appears on posts detected as a different language than the user's app language
- Tapping "Translate" shows the translated text inline below the original
- Translation source is indicated (e.g., "Translated from Spanish by Google Translate")
- Option to auto-translate all posts in foreign languages

## Key Files

| File | Purpose |
|------|---------|
| `src/view/com/post/Post.tsx` | Post component — add "Translate" button below post text |
| `src/components/RichText.tsx` | Rich text renderer — render translated text alongside original |
| `src/locale/i18n.ts` | i18n config — user's current language for comparison |

## Implementation Approach

### 1. Language Detection

Post records include a `langs` field (array of BCP-47 language codes). Use this to detect if translation is needed:

```ts
const postLangs = post.record.langs ?? []
const userLang = i18n.locale.split('-')[0]  // e.g., 'en'
const needsTranslation = postLangs.length > 0 && !postLangs.some(l => l.startsWith(userLang))
```

### 2. Translation API

Options (in order of preference):
- **LibreTranslate** — free, open-source, self-hostable
- **Google Translate API** — reliable, costs money
- **DeepL API** — high quality, free tier available
- **MyMemory API** — free tier with rate limits

```ts
async function translateText(text: string, from: string, to: string): Promise<string> {
  const res = await fetch(`https://libretranslate.com/translate`, {
    method: 'POST',
    body: JSON.stringify({ q: text, source: from, target: to }),
    headers: { 'Content-Type': 'application/json' },
  })
  const data = await res.json()
  return data.translatedText
}
```

### 3. UI

```tsx
{needsTranslation && (
  <Pressable onPress={handleTranslate}>
    <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
      <Trans>Translate post</Trans>
    </Text>
  </Pressable>
)}

{translatedText && (
  <View style={[a.mt_sm, a.p_sm, { backgroundColor: t.palette.contrast_25 }]}>
    <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
      <Trans>Translated from {sourceLang}</Trans>
    </Text>
    <Text style={[a.mt_xs]}>{translatedText}</Text>
  </View>
)}
```

### 4. Caching

Cache translations locally to avoid re-fetching:

```ts
const translationCache = new Map<string, string>()  // key: postUri + targetLang
```

## Edge Cases

- Posts without `langs` field: don't show translate button (can't detect language)
- Multi-language posts: translate to user's language regardless
- Facets in translated text: links and mentions won't carry over — show translated text as plain text
- Rate limits: cache aggressively, implement retry with backoff
- Privacy: translation APIs receive post text — note this in a privacy disclosure
- Cost: if using paid API, may need to limit translations per day or offer as a premium feature
