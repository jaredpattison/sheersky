import {
  AppBskyFeedDefs,
  type AppBskyFeedGetAuthorFeed as GetAuthorFeed,
  BskyAgent,
  jsonStringToLex,
} from '@atproto/api'

import {type FeedAPI, type FeedAPIResponse} from './types'

interface AuthorSource {
  did: string
  cursor: string | undefined
  buffer: AppBskyFeedDefs.FeedViewPost[]
  hasMore: boolean
}

const BATCH_SIZE = 10
const PER_AUTHOR_LIMIT = 15

export class BlockedByFeedAPI implements FeedAPI {
  private _dids: string[]
  private _sources: AuthorSource[] = []
  private _initialized = false
  private _itemCursor = 0

  constructor({dids}: {dids: string[]}) {
    this._dids = dids
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    if (this._dids.length === 0) {
      return undefined as any
    }
    const data = await this._fetchAuthorFeed(this._dids[0], undefined, 1)
    return data?.feed[0] as AppBskyFeedDefs.FeedViewPost
  }

  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    if (!cursor) {
      this._initialize()
    }

    if (this._sources.length === 0) {
      return {feed: []}
    }

    await this._topUpSources(limit)
    const posts = this._drainSorted(limit)

    if (posts.length > 0) {
      this._itemCursor += posts.length
      return {
        cursor: String(this._itemCursor),
        feed: posts,
      }
    }

    return {feed: []}
  }

  private _initialize() {
    this._sources = this._dids.map(did => ({
      did,
      cursor: undefined,
      buffer: [],
      hasMore: true,
    }))
    this._itemCursor = 0
  }

  private async _topUpSources(limit: number) {
    const threshold = Math.max(1, Math.floor(limit / 2))
    const needsData = this._sources.filter(
      s => s.hasMore && s.buffer.length < threshold,
    )

    // Fetch in batches to avoid overwhelming the API
    for (let i = 0; i < needsData.length; i += BATCH_SIZE) {
      const batch = needsData.slice(i, i + BATCH_SIZE)
      await Promise.all(
        batch.map(async source => {
          const data = await this._fetchAuthorFeed(
            source.did,
            source.cursor,
            PER_AUTHOR_LIMIT,
          )
          if (data && data.feed.length > 0) {
            source.buffer.push(...data.feed)
            source.cursor = data.cursor
            if (!data.cursor) {
              source.hasMore = false
            }
          } else {
            source.hasMore = false
          }
        }),
      )
    }
  }

  private _drainSorted(limit: number): AppBskyFeedDefs.FeedViewPost[] {
    // Collect all buffered posts with their source index
    const all: {post: AppBskyFeedDefs.FeedViewPost; sourceIdx: number}[] = []
    for (let i = 0; i < this._sources.length; i++) {
      for (const post of this._sources[i].buffer) {
        all.push({post, sourceIdx: i})
      }
    }

    // Sort by indexedAt desc
    all.sort((a, b) => {
      const aTime = new Date(a.post.post.indexedAt).getTime()
      const bTime = new Date(b.post.post.indexedAt).getTime()
      return bTime - aTime
    })

    // Take top `limit`
    const taken = all.slice(0, limit)

    // Remove taken posts from their source buffers
    const takenBySource = new Map<number, Set<AppBskyFeedDefs.FeedViewPost>>()
    for (const item of taken) {
      if (!takenBySource.has(item.sourceIdx)) {
        takenBySource.set(item.sourceIdx, new Set())
      }
      takenBySource.get(item.sourceIdx)!.add(item.post)
    }

    for (const [sourceIdx, posts] of takenBySource) {
      this._sources[sourceIdx].buffer = this._sources[sourceIdx].buffer.filter(
        p => !posts.has(p),
      )
    }

    return taken.map(t => t.post)
  }

  private async _fetchAuthorFeed(
    did: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<GetAuthorFeed.OutputSchema | null> {
    try {
      const searchParams = new URLSearchParams({
        actor: did,
        limit: String(limit),
        filter: 'posts_and_author_threads',
      })
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
}
