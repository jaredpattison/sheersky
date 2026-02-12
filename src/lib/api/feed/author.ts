import {
  AppBskyFeedDefs,
  AppBskyFeedGetAuthorFeed,
  type AppBskyFeedGetAuthorFeed as GetAuthorFeed,
  BskyAgent,
  type BskyAgent as BskyAgentType,
  jsonStringToLex,
} from '@atproto/api'

import {type FeedAPI, type FeedAPIResponse} from './types'

export class AuthorFeedAPI implements FeedAPI {
  agent: BskyAgentType
  _params: GetAuthorFeed.QueryParams

  constructor({
    agent,
    feedParams,
  }: {
    agent: BskyAgentType
    feedParams: GetAuthorFeed.QueryParams
  }) {
    this.agent = agent
    this._params = feedParams
  }

  get params() {
    const params = {...this._params}
    params.includePins = params.filter === 'posts_and_author_threads'
    return params
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    try {
      const res = await this.agent.getAuthorFeed({
        ...this.params,
        limit: 1,
      })
      return res.data.feed[0]
    } catch (e) {
      if (e instanceof AppBskyFeedGetAuthorFeed.BlockedByActorError) {
        const data = await this._fetchUnauthenticated({limit: 1})
        return data?.feed[0] as AppBskyFeedDefs.FeedViewPost
      }
      throw e
    }
  }

  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    try {
      const res = await this.agent.getAuthorFeed({
        ...this.params,
        cursor,
        limit,
      })
      if (res.success) {
        return {
          cursor: res.data.cursor,
          feed: this._filter(res.data.feed),
        }
      }
      return {
        feed: [],
      }
    } catch (e) {
      // Soft block: if user blocked us, fetch via unauthenticated request
      if (e instanceof AppBskyFeedGetAuthorFeed.BlockedByActorError) {
        const data = await this._fetchUnauthenticated({cursor, limit})
        if (data) {
          return {
            cursor: data.cursor,
            feed: this._filter(data.feed),
          }
        }
        return {feed: []}
      }
      throw e
    }
  }

  async _fetchUnauthenticated({
    cursor,
    limit,
  }: {
    cursor?: string
    limit: number
  }): Promise<GetAuthorFeed.OutputSchema | null> {
    try {
      const params = this.params
      const searchParams = new URLSearchParams({
        actor: params.actor,
        limit: String(limit),
      })
      if (params.filter) searchParams.set('filter', params.filter)
      if (params.includePins) searchParams.set('includePins', 'true')
      if (cursor) searchParams.set('cursor', cursor)

      const labelersHeader = {
        'atproto-accept-labelers': BskyAgent.appLabelers
          .map(l => `${l};redact`)
          .join(', '),
      }

      const res = await fetch(
        `https://api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?${searchParams.toString()}`,
        {
          method: 'GET',
          headers: labelersHeader,
        },
      )

      if (!res.ok) return null

      const data = jsonStringToLex(
        await res.text(),
      ) as GetAuthorFeed.OutputSchema
      return data?.feed?.length ? data : null
    } catch {
      return null
    }
  }

  _filter(feed: AppBskyFeedDefs.FeedViewPost[]) {
    if (this.params.filter === 'posts_and_author_threads') {
      return feed.filter(post => {
        const isReply = post.reply
        const isRepost = AppBskyFeedDefs.isReasonRepost(post.reason)
        const isPin = AppBskyFeedDefs.isReasonPin(post.reason)
        if (!isReply) return true
        if (isRepost || isPin) return true
        return isReply && isAuthorReplyChain(this.params.actor, post, feed)
      })
    }

    return feed
  }
}

function isAuthorReplyChain(
  actor: string,
  post: AppBskyFeedDefs.FeedViewPost,
  posts: AppBskyFeedDefs.FeedViewPost[],
): boolean {
  // current post is by a different user (shouldn't happen)
  if (post.post.author.did !== actor) return false

  const replyParent = post.reply?.parent

  if (AppBskyFeedDefs.isPostView(replyParent)) {
    // reply parent is by a different user
    if (replyParent.author.did !== actor) return false

    // A top-level post that matches the parent of the current post.
    const parentPost = posts.find(p => p.post.uri === replyParent.uri)

    /*
     * Either we haven't fetched the parent at the top level, or the only
     * record we have is on feedItem.reply.parent, which we've already checked
     * above.
     */
    if (!parentPost) return true

    // Walk up to parent
    return isAuthorReplyChain(actor, parentPost, posts)
  }

  // Just default to showing it
  return true
}
