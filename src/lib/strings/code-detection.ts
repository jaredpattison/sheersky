/**
 * Client-side detection of code blocks and inline code in post text.
 * Operates on UTF-16 character indices (JavaScript string positions).
 */

import {type AppBskyRichtextFacet, UnicodeString} from '@atproto/api'

export type CodeBlockRegion = {
  type: 'codeBlock'
  startIndex: number // char index of opening ```
  endIndex: number // char index after closing ``` (or end of string)
  code: string // content between delimiters
  language: string | undefined
}

export type TextRegion = {
  type: 'text'
  startIndex: number
  endIndex: number
  text: string
}

export type Region = CodeBlockRegion | TextRegion

export type InlineCodeSpan = {
  startIndex: number // index of opening backtick
  endIndex: number // index after closing backtick
  code: string // content between backticks
}

/**
 * Check if a string looks like a language identifier (e.g. "js", "python", "c++").
 * Must be a short single word with no spaces.
 */
export function isLanguageId(s: string): boolean {
  return s.length <= 20 && /^[\w+#.-]+$/.test(s)
}

/**
 * Quick check for whether text contains any backticks at all.
 * Used as a fast path to skip parsing for the vast majority of posts.
 */
export function hasCodeContent(text: string): boolean {
  return text.includes('`')
}

/**
 * Parse text into alternating text and code-block regions.
 *
 * Code fences are lines that start with ``` optionally followed by a
 * language identifier. The closing fence is a line that is exactly ```
 * or a line that ends with ``` (to support inline closing like `);```).
 * Unclosed fences extend to end of text.
 */
export function parseCodeRegions(text: string): Region[] {
  const regions: Region[] = []
  const lines = text.split('\n')
  let pos = 0
  let inCodeBlock = false
  let codeBlockStart = 0
  let codeBlockLanguage: string | undefined
  let codeLines: string[] = []
  let textStart = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineStart = pos
    const lineEnd = pos + line.length + (i < lines.length - 1 ? 1 : 0) // +1 for \n

    if (!inCodeBlock) {
      const trimmed = line.trimStart()
      if (trimmed.startsWith('```')) {
        // Opening fence found
        // Flush preceding text region
        if (lineStart > textStart) {
          regions.push({
            type: 'text',
            startIndex: textStart,
            endIndex: lineStart,
            text: text.slice(textStart, lineStart),
          })
        }
        inCodeBlock = true
        codeBlockStart = lineStart
        const afterFence = trimmed.slice(3).trim()
        if (afterFence && isLanguageId(afterFence)) {
          codeBlockLanguage = afterFence
          codeLines = []
        } else if (afterFence) {
          // Text after ``` is code, not a language identifier
          codeBlockLanguage = undefined
          codeLines = [afterFence]
        } else {
          codeBlockLanguage = undefined
          codeLines = []
        }
      }
    } else {
      const trimmed = line.trimStart()
      if (trimmed === '```') {
        // Closing fence on its own line
        regions.push({
          type: 'codeBlock',
          startIndex: codeBlockStart,
          endIndex: lineEnd,
          code: codeLines.join('\n'),
          language: codeBlockLanguage,
        })
        inCodeBlock = false
        textStart = lineEnd
      } else if (line.endsWith('```')) {
        // Closing fence at end of line (e.g. "code;```")
        const lastLine = line.slice(0, line.length - 3)
        if (lastLine.length > 0) {
          codeLines.push(lastLine)
        }
        regions.push({
          type: 'codeBlock',
          startIndex: codeBlockStart,
          endIndex: lineEnd,
          code: codeLines.join('\n'),
          language: codeBlockLanguage,
        })
        inCodeBlock = false
        textStart = lineEnd
      } else {
        codeLines.push(line)
      }
    }

    pos = lineStart + line.length + (i < lines.length - 1 ? 1 : 0)
  }

  // Handle unclosed code fence
  if (inCodeBlock) {
    regions.push({
      type: 'codeBlock',
      startIndex: codeBlockStart,
      endIndex: text.length,
      code: codeLines.join('\n'),
      language: codeBlockLanguage,
    })
  } else if (textStart < text.length) {
    // Trailing text after last code block
    regions.push({
      type: 'text',
      startIndex: textStart,
      endIndex: text.length,
      text: text.slice(textStart, text.length),
    })
  }

  // If no code blocks were found, return a single text region
  if (regions.length === 0) {
    return [
      {
        type: 'text',
        startIndex: 0,
        endIndex: text.length,
        text,
      },
    ]
  }

  return regions
}

/**
 * Detect inline code spans (single backtick pairs) within a text string.
 * Returns spans in order, non-overlapping.
 * Backticks inside code fences should not reach this function — call
 * this only on text regions from parseCodeRegions.
 */
export function parseInlineCode(text: string): InlineCodeSpan[] {
  const spans: InlineCodeSpan[] = []
  let i = 0

  while (i < text.length) {
    if (text[i] === '`') {
      // Found opening backtick, look for closing
      const start = i
      i++
      while (i < text.length && text[i] !== '`' && text[i] !== '\n') {
        i++
      }
      if (i < text.length && text[i] === '`') {
        const code = text.slice(start + 1, i)
        if (code.length > 0) {
          spans.push({
            startIndex: start,
            endIndex: i + 1,
            code,
          })
        }
        i++ // skip closing backtick
      }
      // If no closing backtick found (hit \n or end), treat as literal — skip
    } else {
      i++
    }
  }

  return spans
}

/**
 * Filter and adjust facets for a sub-region of the full text.
 * Facets use UTF-8 byte indices; we convert the region's character
 * boundaries to byte boundaries, keep facets within range, and
 * adjust their byte offsets to be relative to the region start.
 */
export function facetsForRegion(
  allFacets: AppBskyRichtextFacet.Main[] | undefined,
  regionCharStart: number,
  regionCharEnd: number,
  fullText: string,
): AppBskyRichtextFacet.Main[] | undefined {
  if (!allFacets?.length) return undefined

  const fullUnicode = new UnicodeString(fullText)
  const regionByteStart = fullUnicode.utf16IndexToUtf8Index(regionCharStart)
  const regionByteEnd = fullUnicode.utf16IndexToUtf8Index(regionCharEnd)

  const filtered = allFacets
    .filter(
      f =>
        f.index.byteStart >= regionByteStart &&
        f.index.byteEnd <= regionByteEnd,
    )
    .map(f => ({
      ...f,
      index: {
        byteStart: f.index.byteStart - regionByteStart,
        byteEnd: f.index.byteEnd - regionByteStart,
      },
    }))

  return filtered.length > 0 ? filtered : undefined
}
