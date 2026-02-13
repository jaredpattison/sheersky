import {
  type CodeBlockRegion,
  facetsForRegion,
  hasCodeContent,
  isLanguageId,
  parseCodeRegions,
  parseInlineCode,
  type TextRegion,
} from '../../src/lib/strings/code-detection'

describe('isLanguageId', () => {
  it('accepts common language identifiers', () => {
    expect(isLanguageId('js')).toBe(true)
    expect(isLanguageId('python')).toBe(true)
    expect(isLanguageId('tsx')).toBe(true)
    expect(isLanguageId('c')).toBe(true)
    expect(isLanguageId('objective-c')).toBe(true)
    expect(isLanguageId('c++')).toBe(true)
    expect(isLanguageId('c#')).toBe(true)
    expect(isLanguageId('html5')).toBe(true)
  })

  it('rejects strings with spaces', () => {
    expect(isLanguageId('const x = 1')).toBe(false)
    expect(isLanguageId('hello world')).toBe(false)
  })

  it('rejects strings with parentheses or special chars', () => {
    expect(isLanguageId('createRoot()')).toBe(false)
    expect(isLanguageId('foo(bar)')).toBe(false)
    expect(isLanguageId('a;b')).toBe(false)
    expect(isLanguageId('x=1')).toBe(false)
  })

  it('rejects strings longer than 20 characters', () => {
    expect(isLanguageId('abcdefghijklmnopqrstu')).toBe(false)
    expect(isLanguageId('abcdefghijklmnopqrst')).toBe(true) // exactly 20
  })

  it('rejects empty string', () => {
    expect(isLanguageId('')).toBe(false)
  })
})

describe('hasCodeContent', () => {
  it('returns false for text without backticks', () => {
    expect(hasCodeContent('Hello world')).toBe(false)
    expect(hasCodeContent('No code here!')).toBe(false)
  })

  it('returns true for text with backticks', () => {
    expect(hasCodeContent('Use `code` here')).toBe(true)
    expect(hasCodeContent('```\ncode\n```')).toBe(true)
  })
})

describe('parseCodeRegions', () => {
  it('returns single text region for text without code fences', () => {
    const regions = parseCodeRegions('Hello world')
    expect(regions).toEqual([
      {type: 'text', startIndex: 0, endIndex: 11, text: 'Hello world'},
    ])
  })

  it('parses a single code block with language', () => {
    const text = 'Before\n```js\nconst x = 1\n```\nAfter'
    const regions = parseCodeRegions(text)
    expect(regions).toEqual([
      {type: 'text', startIndex: 0, endIndex: 7, text: 'Before\n'},
      {
        type: 'codeBlock',
        startIndex: 7,
        endIndex: 29,
        code: 'const x = 1',
        language: 'js',
      },
      {type: 'text', startIndex: 29, endIndex: 34, text: 'After'},
    ])
  })

  it('parses a code block without language', () => {
    const text = '```\nhello\n```'
    const regions = parseCodeRegions(text)
    expect(regions).toEqual([
      {
        type: 'codeBlock',
        startIndex: 0,
        endIndex: 13,
        code: 'hello',
        language: undefined,
      },
    ])
  })

  it('handles unclosed code fence', () => {
    const text = 'Before\n```python\nprint("hi")'
    const regions = parseCodeRegions(text)
    expect(regions).toEqual([
      {type: 'text', startIndex: 0, endIndex: 7, text: 'Before\n'},
      {
        type: 'codeBlock',
        startIndex: 7,
        endIndex: 28,
        code: 'print("hi")',
        language: 'python',
      },
    ])
  })

  it('handles empty code block', () => {
    const text = '```\n```'
    const regions = parseCodeRegions(text)
    expect(regions).toEqual([
      {
        type: 'codeBlock',
        startIndex: 0,
        endIndex: 7,
        code: '',
        language: undefined,
      },
    ])
  })

  it('handles code block at start of text', () => {
    const text = '```\ncode\n```\nAfter'
    const regions = parseCodeRegions(text)
    expect(regions).toHaveLength(2)
    expect(regions[0].type).toBe('codeBlock')
    expect(regions[1]).toEqual({
      type: 'text',
      startIndex: 13,
      endIndex: 18,
      text: 'After',
    })
  })

  it('handles code block at end of text', () => {
    const text = 'Before\n```\ncode\n```'
    const regions = parseCodeRegions(text)
    expect(regions).toHaveLength(2)
    expect(regions[0].type).toBe('text')
    expect(regions[1].type).toBe('codeBlock')
  })

  it('handles multiple code blocks', () => {
    const text = 'A\n```js\nx\n```\nB\n```py\ny\n```\nC'
    const regions = parseCodeRegions(text)
    expect(regions).toHaveLength(5)
    expect(regions[0].type).toBe('text')
    expect(regions[1].type).toBe('codeBlock')
    expect((regions[1] as CodeBlockRegion).language).toBe('js')
    expect(regions[2].type).toBe('text')
    expect(regions[3].type).toBe('codeBlock')
    expect((regions[3] as CodeBlockRegion).language).toBe('py')
    expect(regions[4].type).toBe('text')
  })

  it('handles multiline code content', () => {
    const text = '```\nline1\nline2\nline3\n```'
    const regions = parseCodeRegions(text)
    expect(regions).toHaveLength(1)
    expect(regions[0].type).toBe('codeBlock')
    expect((regions[0] as CodeBlockRegion).code).toBe('line1\nline2\nline3')
  })

  it('handles code fence with leading whitespace', () => {
    const text = '  ```js\ncode\n  ```'
    const regions = parseCodeRegions(text)
    // Leading whitespace before ``` is allowed
    expect(regions).toHaveLength(1)
    expect(regions[0].type).toBe('codeBlock')
  })

  it('does not treat inline backticks as code fences', () => {
    const text = 'Use `code` inline'
    const regions = parseCodeRegions(text)
    // No code fence, just a text region
    expect(regions).toEqual([
      {type: 'text', startIndex: 0, endIndex: 17, text: 'Use `code` inline'},
    ])
  })

  it('handles closing fence at end of line', () => {
    const text = 'test\n```js\nconst x = 1;```\nafter'
    const regions = parseCodeRegions(text)
    expect(regions).toHaveLength(3)
    expect(regions[0].type).toBe('text')
    expect(regions[1].type).toBe('codeBlock')
    expect((regions[1] as CodeBlockRegion).code).toBe('const x = 1;')
    expect((regions[1] as CodeBlockRegion).language).toBe('js')
    expect(regions[2].type).toBe('text')
    expect((regions[2] as TextRegion).text).toBe('after')
  })

  it('handles closing fence at end of last line (no trailing text)', () => {
    const text = '```\ncode here```'
    const regions = parseCodeRegions(text)
    expect(regions).toHaveLength(1)
    expect(regions[0].type).toBe('codeBlock')
    expect((regions[0] as CodeBlockRegion).code).toBe('code here')
  })

  it('handles backticks inside code blocks as literal', () => {
    const text = '```\nuse `this` here\n```'
    const regions = parseCodeRegions(text)
    expect(regions).toHaveLength(1)
    expect((regions[0] as CodeBlockRegion).code).toBe('use `this` here')
  })
})

describe('parseInlineCode', () => {
  it('returns empty array for text without backticks', () => {
    expect(parseInlineCode('Hello world')).toEqual([])
  })

  it('detects single inline code span', () => {
    const spans = parseInlineCode('Use `code` here')
    expect(spans).toEqual([{startIndex: 4, endIndex: 10, code: 'code'}])
  })

  it('detects multiple inline code spans', () => {
    const spans = parseInlineCode('Use `a` and `b` here')
    expect(spans).toEqual([
      {startIndex: 4, endIndex: 7, code: 'a'},
      {startIndex: 12, endIndex: 15, code: 'b'},
    ])
  })

  it('handles unclosed backtick as literal', () => {
    const spans = parseInlineCode('Use `code here')
    expect(spans).toEqual([])
  })

  it('does not span across newlines', () => {
    const spans = parseInlineCode('Use `code\nhere`')
    expect(spans).toEqual([])
  })

  it('skips empty inline code', () => {
    const spans = parseInlineCode('Use `` here')
    expect(spans).toEqual([])
  })

  it('handles inline code at start and end', () => {
    const spans = parseInlineCode('`start` middle `end`')
    expect(spans).toEqual([
      {startIndex: 0, endIndex: 7, code: 'start'},
      {startIndex: 15, endIndex: 20, code: 'end'},
    ])
  })

  it('handles inline code with spaces', () => {
    const spans = parseInlineCode('Use `some code` here')
    expect(spans).toEqual([{startIndex: 4, endIndex: 15, code: 'some code'}])
  })

  it('handles adjacent inline code spans', () => {
    const spans = parseInlineCode('`a``b`')
    expect(spans).toEqual([
      {startIndex: 0, endIndex: 3, code: 'a'},
      {startIndex: 3, endIndex: 6, code: 'b'},
    ])
  })
})

describe('parseCodeRegions — language vs code on opening line', () => {
  it('treats short identifier as language', () => {
    const text = '```js\ncode\n```'
    const regions = parseCodeRegions(text)
    expect((regions[0] as CodeBlockRegion).language).toBe('js')
    expect((regions[0] as CodeBlockRegion).code).toBe('code')
  })

  it('treats code with parens as first line of code, not language', () => {
    const text = '```createRoot(document.getElementById("root"))\nmore\n```'
    const regions = parseCodeRegions(text)
    expect((regions[0] as CodeBlockRegion).language).toBeUndefined()
    expect((regions[0] as CodeBlockRegion).code).toBe(
      'createRoot(document.getElementById("root"))\nmore',
    )
  })

  it('treats code with spaces as first line of code', () => {
    const text = '```const x = 1\n```'
    const regions = parseCodeRegions(text)
    expect((regions[0] as CodeBlockRegion).language).toBeUndefined()
    expect((regions[0] as CodeBlockRegion).code).toBe('const x = 1')
  })

  it('treats long string as code, not language', () => {
    const text = '```thisisaverylonglanguagename\ncode\n```'
    const regions = parseCodeRegions(text)
    expect((regions[0] as CodeBlockRegion).language).toBeUndefined()
    expect((regions[0] as CodeBlockRegion).code).toBe(
      'thisisaverylonglanguagename\ncode',
    )
  })
})

describe('facetsForRegion', () => {
  // Helper to create a facet with byte indices
  function makeFacet(
    byteStart: number,
    byteEnd: number,
    type: 'mention' | 'link' = 'mention',
  ) {
    return {
      index: {byteStart, byteEnd},
      features: [
        type === 'mention'
          ? {$type: 'app.bsky.richtext.facet#mention', did: 'did:plc:test'}
          : {$type: 'app.bsky.richtext.facet#link', uri: 'https://example.com'},
      ],
    }
  }

  it('returns undefined for undefined facets', () => {
    expect(facetsForRegion(undefined, 0, 10, 'hello world')).toBeUndefined()
  })

  it('returns undefined for empty facets', () => {
    expect(facetsForRegion([], 0, 10, 'hello world')).toBeUndefined()
  })

  it('keeps facets within the region and adjusts byte indices', () => {
    // "Hello @test World" — @test is at char 6-11
    // In UTF-8: H(0) e(1) l(2) l(3) o(4) ' '(5) @(6) t(7) e(8) s(9) t(10) ' '(11) W(12)...
    const fullText = 'Hello @test World'
    const facet = makeFacet(6, 11) // @test in bytes
    const result = facetsForRegion([facet], 0, 17, fullText)
    expect(result).toHaveLength(1)
    expect(result![0].index).toEqual({byteStart: 6, byteEnd: 11})
  })

  it('adjusts byte indices relative to region start', () => {
    // Region starts at char 6: "@test World"
    const fullText = 'Hello @test World'
    const facet = makeFacet(6, 11) // @test in full text bytes
    const result = facetsForRegion([facet], 6, 17, fullText)
    expect(result).toHaveLength(1)
    expect(result![0].index).toEqual({byteStart: 0, byteEnd: 5})
  })

  it('excludes facets outside the region', () => {
    const fullText = 'Before @mention After'
    const facet = makeFacet(7, 15) // @mention
    // Region is just "Before " (0-7)
    const result = facetsForRegion([facet], 0, 7, fullText)
    expect(result).toBeUndefined()
  })

  it('excludes facets that span region boundaries', () => {
    const fullText = 'AB@testCD'
    // Facet spans chars 2-7 in a 9-char string
    const facet = makeFacet(2, 7)
    // Region is chars 0-5 (doesn't contain full facet)
    const result = facetsForRegion([facet], 0, 5, fullText)
    expect(result).toBeUndefined()
  })

  it('handles multiple facets across regions', () => {
    const fullText = '@alice hello @bob'
    // @alice: bytes 0-6, @bob: bytes 13-17
    const facets = [makeFacet(0, 6), makeFacet(13, 17)]
    // Region is "@alice hello " (0-13)
    const result = facetsForRegion(facets, 0, 13, fullText)
    expect(result).toHaveLength(1)
    expect(result![0].index).toEqual({byteStart: 0, byteEnd: 6})
  })

  it('handles multi-byte UTF-8 characters', () => {
    // Emoji is 4 bytes in UTF-8 but 2 chars in UTF-16 (surrogate pair)
    const fullText = '😀 @test end'
    // '😀' = 4 bytes, ' ' = 1 byte, '@test' starts at byte 5
    // In UTF-16: '😀' = 2 chars, ' ' = 1 char, '@test' starts at char 3
    const facet = makeFacet(5, 10) // @test in bytes
    // Region starts after emoji+space: char 3 to end
    const result = facetsForRegion([facet], 3, 12, fullText)
    expect(result).toHaveLength(1)
    expect(result![0].index).toEqual({byteStart: 0, byteEnd: 5})
  })
})
