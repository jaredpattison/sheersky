import {useMemo} from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/macro'
import {useQuery} from '@tanstack/react-query'

import {fetchUnauthenticatedPosts} from '#/lib/api/unauthenticated'
import {createEmbedViewRecordFromPost} from '#/state/queries/postgate/util'
import {atoms as a, useTheme} from '#/alf'
import {QuoteEmbed} from '#/components/Post/Embed'
import {PostPlaceholder as PostPlaceholderText} from '#/components/Post/Embed/PostPlaceholder'
import {type CommonProps} from '#/components/Post/Embed/types'
import {type EmbedType} from '#/types/bsky/post'

/**
 * Soft block: Renders a quote embed for a post whose author has blocked the
 * viewer. Fetches the post content via unauthenticated API and renders it
 * using the standard QuoteEmbed component.
 */
export function BlockedQuoteEmbed({
  embed,
  ...rest
}: Omit<CommonProps, 'viewContext'> & {
  embed: EmbedType<'post_blocked'>
}) {
  const t = useTheme()
  const uri = embed.view.uri

  const {data: post, isLoading} = useQuery({
    queryKey: ['blocked-quote-embed', uri],
    async queryFn() {
      const result = await fetchUnauthenticatedPosts([uri])
      return result?.posts?.[0] ?? null
    },
    staleTime: 60_000,
  })

  const view = useMemo(() => {
    if (!post) return undefined
    return createEmbedViewRecordFromPost(post)
  }, [post])

  if (view) {
    return (
      <QuoteEmbed
        {...rest}
        embed={{
          type: 'post',
          view,
        }}
      />
    )
  }

  if (isLoading) {
    return (
      <View
        style={[a.w_full, a.rounded_md, t.atoms.bg_contrast_25, {height: 68}]}
      />
    )
  }

  // Fetch failed or post not found — fall back to "Blocked" placeholder
  return (
    <PostPlaceholderText>
      <Trans>Blocked</Trans>
    </PostPlaceholderText>
  )
}
