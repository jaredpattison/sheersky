import {i18n} from '@lingui/core'

import * as persisted from '#/state/persisted'

// Replacement pairs ordered longest-first to avoid partial matches
const REPLACEMENTS: [RegExp, string][] = [
  [/\bReposting\b/g, 'Reskeeting'],
  [/\breposting\b/g, 'reskeeting'],
  [/\bReposted\b/g, 'Reskeeted'],
  [/\breposted\b/g, 'reskeeted'],
  [/\bReposts\b/g, 'Reskeets'],
  [/\breposts\b/g, 'reskeets'],
  [/\bRepost\b/g, 'Reskeet'],
  [/\brepost\b/g, 'reskeet'],
  [/\bPosting\b/g, 'Skeeting'],
  [/\bposting\b/g, 'skeeting'],
  [/\bPosted\b/g, 'Skeeted'],
  [/\bposted\b/g, 'skeeted'],
  [/\bPosts\b/g, 'Skeets'],
  [/\bposts\b/g, 'skeets'],
  [/\bPost\b/g, 'Skeet'],
  [/\bpost\b/g, 'skeet'],
]

export function applySkeetTerminology(text: string): string {
  if (!text) return text
  let result = text
  for (const [pattern, replacement] of REPLACEMENTS) {
    result = result.replace(pattern, replacement)
  }
  return result
}

function isEnabled(): boolean {
  return persisted.get('useSkeetTerminology') === true
}

/**
 * Monkey-patches i18n._ and i18n.t to post-process strings through
 * skeet terminology replacement when the preference is enabled.
 * Call once at module load time.
 */
export function setupSkeetTerminologyPatch(): void {
  const original_ = i18n._.bind(i18n)
  const originalT = i18n.t.bind(i18n)

  // @ts-expect-error - patching read-only method
  i18n._ = (...args: Parameters<typeof i18n._>): string => {
    const result = original_(...args)
    if (isEnabled()) {
      return applySkeetTerminology(result)
    }
    return result
  }

  // @ts-expect-error - patching read-only method
  i18n.t = (...args: Parameters<typeof i18n.t>): string => {
    const result = originalT(...args)
    if (isEnabled()) {
      return applySkeetTerminology(result)
    }
    return result
  }
}
