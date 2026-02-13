import React, {useMemo} from 'react'
import {type StyleProp, type TextStyle, View} from 'react-native'
import {AppBskyRichtextFacet, RichText as RichTextAPI} from '@atproto/api'

import {
  facetsForRegion,
  hasCodeContent,
  type InlineCodeSpan,
  parseCodeRegions,
  parseInlineCode,
  type Region,
} from '#/lib/strings/code-detection'
import {toShortUrl} from '#/lib/strings/url-helpers'
import {atoms as a, flatten, type TextStyleProp} from '#/alf'
import {isOnlyEmoji} from '#/alf/typography'
import {CodeBlock} from '#/components/CodeBlock'
import {InlineCode} from '#/components/InlineCode'
import {InlineLinkText, type LinkProps} from '#/components/Link'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {RichTextTag} from '#/components/RichTextTag'
import {Text, type TextProps} from '#/components/Typography'

const WORD_WRAP = {wordWrap: 1}
// lifted from facet detection in `RichText` impl, _without_ `gm` flags
const URL_REGEX =
  /(^|\s|\()((https?:\/\/[\S]+)|((?<domain>[a-z][a-z0-9]*(\.[a-z0-9]+)+)[\S]*))/i

export type RichTextProps = TextStyleProp &
  Pick<TextProps, 'selectable' | 'onLayout' | 'onTextLayout'> & {
    value: RichTextAPI | string
    testID?: string
    numberOfLines?: number
    disableLinks?: boolean
    enableTags?: boolean
    authorHandle?: string
    onLinkPress?: LinkProps['onPress']
    interactiveStyle?: StyleProp<TextStyle>
    emojiMultiplier?: number
    shouldProxyLinks?: boolean
    /**
     * DANGEROUS: Disable facet lexicon validation
     *
     * `detectFacetsWithoutResolution()` generates technically invalid facets,
     * with a handle in place of the DID. This means that RichText that uses it
     * won't be able to render links.
     *
     * Use with care - only use if you're rendering facets you're generating yourself.
     */
    disableMentionFacetValidation?: true
  }

export function RichText({
  testID,
  value,
  style,
  numberOfLines,
  disableLinks,
  selectable,
  enableTags = false,
  authorHandle,
  onLinkPress,
  interactiveStyle,
  emojiMultiplier = 1.85,
  onLayout,
  onTextLayout,
  shouldProxyLinks,
  disableMentionFacetValidation,
}: RichTextProps) {
  const richText = useMemo(() => {
    if (value instanceof RichTextAPI) {
      return value
    } else {
      const rt = new RichTextAPI({text: value})
      rt.detectFacetsWithoutResolution()
      return rt
    }
  }, [value])

  const plainStyles = [a.leading_snug, style]
  const interactiveStyles = [plainStyles, interactiveStyle]

  const {text, facets} = richText

  const hasCode = hasCodeContent(text)

  // --- Code block path: switch to <View> layout ---
  if (hasCode) {
    const regions = parseCodeRegions(text)
    if (regions.some(r => r.type === 'codeBlock')) {
      // eslint-disable-next-line bsky-internal/avoid-unwrapped-text
      return (
        <RichTextCodeBlocks
          regions={regions}
          facets={facets}
          fullText={text}
          testID={testID}
          onLayout={onLayout}
          style={style}
          selectable={selectable}
          disableLinks={disableLinks}
          enableTags={enableTags}
          authorHandle={authorHandle}
          onLinkPress={onLinkPress}
          interactiveStyle={interactiveStyle}
          emojiMultiplier={emojiMultiplier}
          shouldProxyLinks={shouldProxyLinks}
          disableMentionFacetValidation={disableMentionFacetValidation}
        />
      )
    }
  }

  // --- No facets path ---
  if (!facets?.length) {
    if (isOnlyEmoji(text)) {
      const flattenedStyle = flatten(style) ?? {}
      const fontSize =
        (flattenedStyle.fontSize ?? a.text_sm.fontSize) * emojiMultiplier
      return (
        <Text
          emoji
          selectable={selectable}
          testID={testID}
          style={[plainStyles, {fontSize}]}
          onLayout={onLayout}
          onTextLayout={onTextLayout}
          // @ts-ignore web only -prf
          dataSet={WORD_WRAP}>
          {text}
        </Text>
      )
    }

    // Inline code in plain text (no facets)
    if (hasCode) {
      const spans = parseInlineCode(text)
      if (spans.length > 0) {
        return (
          <Text
            emoji
            selectable={selectable}
            testID={testID}
            style={plainStyles}
            numberOfLines={numberOfLines}
            onLayout={onLayout}
            onTextLayout={onTextLayout}
            // @ts-ignore web only -prf
            dataSet={WORD_WRAP}>
            {renderTextWithInlineCode(text, spans)}
          </Text>
        )
      }
    }

    return (
      <Text
        emoji
        selectable={selectable}
        testID={testID}
        style={plainStyles}
        numberOfLines={numberOfLines}
        onLayout={onLayout}
        onTextLayout={onTextLayout}
        // @ts-ignore web only -prf
        dataSet={WORD_WRAP}>
        {text}
      </Text>
    )
  }

  // --- Facets path ---
  const els = []
  let key = 0
  // N.B. must access segments via `richText.segments`, not via destructuring
  for (const segment of richText.segments()) {
    const link = segment.link
    const mention = segment.mention
    const tag = segment.tag

    if (
      mention &&
      (disableMentionFacetValidation ||
        AppBskyRichtextFacet.validateMention(mention).success) &&
      !disableLinks
    ) {
      els.push(
        <ProfileHoverCard key={key} did={mention.did}>
          <InlineLinkText
            selectable={selectable}
            to={`/profile/${mention.did}`}
            style={interactiveStyles}
            // @ts-ignore TODO
            dataSet={WORD_WRAP}
            shouldProxy={shouldProxyLinks}
            onPress={onLinkPress}>
            {segment.text}
          </InlineLinkText>
        </ProfileHoverCard>,
      )
    } else if (link && AppBskyRichtextFacet.validateLink(link).success) {
      const isValidLink = URL_REGEX.test(link.uri)
      if (!isValidLink || disableLinks) {
        els.push(toShortUrl(segment.text))
      } else {
        els.push(
          <InlineLinkText
            selectable={selectable}
            key={key}
            to={link.uri}
            style={interactiveStyles}
            // @ts-ignore TODO
            dataSet={WORD_WRAP}
            shareOnLongPress
            shouldProxy={shouldProxyLinks}
            onPress={onLinkPress}
            emoji>
            {toShortUrl(segment.text)}
          </InlineLinkText>,
        )
      }
    } else if (
      !disableLinks &&
      enableTags &&
      tag &&
      AppBskyRichtextFacet.validateTag(tag).success
    ) {
      els.push(
        <RichTextTag
          key={key}
          display={segment.text}
          tag={tag.tag}
          textStyle={interactiveStyles}
          authorHandle={authorHandle}
        />,
      )
    } else {
      // Plain text segment — check for inline code
      if (hasCode) {
        const spans = parseInlineCode(segment.text)
        if (spans.length > 0) {
          els.push(
            <React.Fragment key={key}>
              {renderTextWithInlineCode(segment.text, spans)}
            </React.Fragment>,
          )
        } else {
          els.push(segment.text)
        }
      } else {
        els.push(segment.text)
      }
    }
    key++
  }

  return (
    <Text
      emoji
      selectable={selectable}
      testID={testID}
      style={plainStyles}
      numberOfLines={numberOfLines}
      onLayout={onLayout}
      onTextLayout={onTextLayout}
      // @ts-ignore web only -prf
      dataSet={WORD_WRAP}>
      {els}
    </Text>
  )
}

/**
 * Split text by inline code spans and interleave <InlineCode> components.
 */
function renderTextWithInlineCode(
  text: string,
  spans: InlineCodeSpan[],
): React.ReactNode[] {
  const els: React.ReactNode[] = []
  let lastEnd = 0
  for (const span of spans) {
    if (span.startIndex > lastEnd) {
      els.push(text.slice(lastEnd, span.startIndex))
    }
    els.push(<InlineCode key={`ic-${span.startIndex}`}>{span.code}</InlineCode>)
    lastEnd = span.endIndex
  }
  if (lastEnd < text.length) {
    els.push(text.slice(lastEnd))
  }
  return els
}

/**
 * Renders post text that contains code blocks as a <View> with
 * interleaved <RichText> (for text regions) and <CodeBlock> elements.
 * Extracted from RichText to satisfy the avoid-unwrapped-text lint rule.
 */
function RichTextCodeBlocks({
  regions,
  facets,
  fullText,
  testID,
  onLayout,
  style,
  selectable,
  disableLinks,
  enableTags,
  authorHandle,
  onLinkPress,
  interactiveStyle,
  emojiMultiplier,
  shouldProxyLinks,
  disableMentionFacetValidation,
}: {
  regions: Region[]
  facets: AppBskyRichtextFacet.Main[] | undefined
  fullText: string
  testID?: string
  onLayout?: RichTextProps['onLayout']
  style?: RichTextProps['style']
  selectable?: boolean
  disableLinks?: boolean
  enableTags?: boolean
  authorHandle?: string
  onLinkPress?: RichTextProps['onLinkPress']
  interactiveStyle?: RichTextProps['interactiveStyle']
  emojiMultiplier?: number
  shouldProxyLinks?: boolean
  disableMentionFacetValidation?: true
}) {
  return (
    <View testID={testID} onLayout={onLayout}>
      {regions.map((region, i) => {
        if (region.type === 'codeBlock') {
          return (
            <CodeBlock key={i} code={region.code} language={region.language} />
          )
        }
        const subFacets = facetsForRegion(
          facets,
          region.startIndex,
          region.endIndex,
          fullText,
        )
        const subRt = new RichTextAPI({
          text: region.text,
          facets: subFacets,
        })
        return (
          <RichText
            key={i}
            value={subRt}
            style={style}
            selectable={selectable}
            disableLinks={disableLinks}
            enableTags={enableTags}
            authorHandle={authorHandle}
            onLinkPress={onLinkPress}
            interactiveStyle={interactiveStyle}
            emojiMultiplier={emojiMultiplier}
            shouldProxyLinks={shouldProxyLinks}
            disableMentionFacetValidation={disableMentionFacetValidation}
          />
        )
      })}
    </View>
  )
}
