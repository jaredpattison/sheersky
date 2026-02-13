import {type AppBskyFeedDefs} from '@atproto/api'
import {type InfiniteData, QueryClient} from '@tanstack/react-query'

// Mock modules that cause platform issues when importing post-feed.ts
jest.mock('../../modules/bottom-sheet', () => ({
  BottomSheet: {},
}))
jest.mock('../../src/components/Dialog', () => ({}))
jest.mock('../../src/state/dialogs', () => ({
  useDialogStateControlContext: jest.fn(),
}))

import {
  applyPrependedItems,
  type FeedPageUnselected,
  fetchLatestItems,
  RQKEY,
} from '../../src/state/queries/post-feed'

const VALID_CID = 'bafyreig6fcr7pxa4gj5tu4jkbqbu37yaxqnxfjntbknbyomu6pjn3f5mqy'

function makePostView(uri: string, did: string): AppBskyFeedDefs.PostView {
  return {
    $type: 'app.bsky.feed.defs#postView',
    uri,
    cid: VALID_CID,
    author: {
      $type: 'app.bsky.actor.defs#profileViewBasic',
      did,
      handle: `${did}.test`,
    },
    record: {
      $type: 'app.bsky.feed.post',
      text: 'test',
      createdAt: new Date().toISOString(),
    },
    indexedAt: new Date().toISOString(),
  }
}

function makeFeedPost(
  postUri: string,
  authorDid: string,
): AppBskyFeedDefs.FeedViewPost {
  return {
    post: makePostView(postUri, authorDid),
  }
}

function makeMockApi(
  fetchResult: AppBskyFeedDefs.FeedViewPost[] = [],
): FeedPageUnselected['api'] {
  return {
    peekLatest: jest.fn(),
    fetch: jest.fn().mockResolvedValue({
      feed: fetchResult,
      cursor: 'cursor-1',
    }),
  } as any
}

function makePageData(
  feed: AppBskyFeedDefs.FeedViewPost[],
  api?: FeedPageUnselected['api'],
): InfiniteData<FeedPageUnselected> {
  return {
    pageParams: [undefined],
    pages: [
      {
        api: api ?? makeMockApi(),
        cursor: 'cursor-0',
        feed,
        fetchedAt: 1000,
      },
    ],
  }
}

const QUERY_KEY = RQKEY('following')

// ============================================================
// applyPrependedItems
// ============================================================
describe('applyPrependedItems', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  it('prepends new items to page 0', () => {
    const existing = [makeFeedPost('at://post/1', 'did:alice')]
    queryClient.setQueryData(QUERY_KEY, makePageData(existing))

    const newItems = [makeFeedPost('at://post/2', 'did:bob')]
    applyPrependedItems(queryClient, QUERY_KEY, newItems)

    const data =
      queryClient.getQueryData<InfiniteData<FeedPageUnselected>>(QUERY_KEY)
    expect(data?.pages[0].feed).toHaveLength(2)
    expect(data?.pages[0].feed[0].post.uri).toBe('at://post/2')
    expect(data?.pages[0].feed[1].post.uri).toBe('at://post/1')
  })

  it('deduplicates against existing items', () => {
    const existing = [makeFeedPost('at://post/1', 'did:alice')]
    queryClient.setQueryData(QUERY_KEY, makePageData(existing))

    const newItems = [
      makeFeedPost('at://post/1', 'did:alice'), // duplicate
      makeFeedPost('at://post/2', 'did:bob'), // new
    ]
    applyPrependedItems(queryClient, QUERY_KEY, newItems)

    const data =
      queryClient.getQueryData<InfiniteData<FeedPageUnselected>>(QUERY_KEY)
    expect(data?.pages[0].feed).toHaveLength(2)
    expect(data?.pages[0].feed[0].post.uri).toBe('at://post/2')
    expect(data?.pages[0].feed[1].post.uri).toBe('at://post/1')
  })

  it('no-ops when all items are duplicates', () => {
    const existing = [makeFeedPost('at://post/1', 'did:alice')]
    const originalData = makePageData(existing)
    queryClient.setQueryData(QUERY_KEY, originalData)

    const newItems = [makeFeedPost('at://post/1', 'did:alice')]
    applyPrependedItems(queryClient, QUERY_KEY, newItems)

    const data =
      queryClient.getQueryData<InfiniteData<FeedPageUnselected>>(QUERY_KEY)
    // Should return original data unchanged
    expect(data?.pages[0].feed).toHaveLength(1)
    expect(data?.pages[0].fetchedAt).toBe(1000)
  })

  it('updates fetchedAt timestamp', () => {
    const existing = [makeFeedPost('at://post/1', 'did:alice')]
    queryClient.setQueryData(QUERY_KEY, makePageData(existing))

    const now = Date.now()
    const newItems = [makeFeedPost('at://post/2', 'did:bob')]
    applyPrependedItems(queryClient, QUERY_KEY, newItems)

    const data =
      queryClient.getQueryData<InfiniteData<FeedPageUnselected>>(QUERY_KEY)
    expect(data?.pages[0].fetchedAt).toBeGreaterThanOrEqual(now)
  })

  it('leaves pages 1+ unchanged', () => {
    const page0Feed = [makeFeedPost('at://post/1', 'did:alice')]
    const page1Feed = [makeFeedPost('at://post/10', 'did:carol')]
    const api = makeMockApi()
    const data: InfiniteData<FeedPageUnselected> = {
      pageParams: [undefined, {cursor: 'cursor-0', api}],
      pages: [
        {api, cursor: 'cursor-0', feed: page0Feed, fetchedAt: 1000},
        {api, cursor: 'cursor-1', feed: page1Feed, fetchedAt: 2000},
      ],
    }
    queryClient.setQueryData(QUERY_KEY, data)

    const newItems = [makeFeedPost('at://post/2', 'did:bob')]
    applyPrependedItems(queryClient, QUERY_KEY, newItems)

    const result =
      queryClient.getQueryData<InfiniteData<FeedPageUnselected>>(QUERY_KEY)
    expect(result?.pages).toHaveLength(2)
    // Page 1 should be reference-equal (untouched)
    expect(result?.pages[1]).toBe(data.pages[1])
    expect(result?.pages[1].feed[0].post.uri).toBe('at://post/10')
  })

  it('no-ops when cache has no pages', () => {
    // Don't set any data
    const newItems = [makeFeedPost('at://post/1', 'did:alice')]
    applyPrependedItems(queryClient, QUERY_KEY, newItems)

    const data =
      queryClient.getQueryData<InfiniteData<FeedPageUnselected>>(QUERY_KEY)
    expect(data).toBeUndefined()
  })
})

// ============================================================
// fetchLatestItems
// ============================================================
describe('fetchLatestItems', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  it('returns only new items not in page 0', async () => {
    const existing = [makeFeedPost('at://post/1', 'did:alice')]
    const apiResult = [
      makeFeedPost('at://post/2', 'did:bob'),
      makeFeedPost('at://post/1', 'did:alice'), // already exists
    ]
    const api = makeMockApi(apiResult)
    queryClient.setQueryData(QUERY_KEY, makePageData(existing, api))

    const result = await fetchLatestItems(queryClient, QUERY_KEY)
    expect(result).toHaveLength(1)
    expect(result![0].post.uri).toBe('at://post/2')
  })

  it('returns null when no new items', async () => {
    const existing = [makeFeedPost('at://post/1', 'did:alice')]
    const apiResult = [makeFeedPost('at://post/1', 'did:alice')]
    const api = makeMockApi(apiResult)
    queryClient.setQueryData(QUERY_KEY, makePageData(existing, api))

    const result = await fetchLatestItems(queryClient, QUERY_KEY)
    expect(result).toBeNull()
  })

  it('returns null when cache is empty', async () => {
    const result = await fetchLatestItems(queryClient, QUERY_KEY)
    expect(result).toBeNull()
  })

  it('calls api.fetch with cursor undefined', async () => {
    const existing = [makeFeedPost('at://post/1', 'did:alice')]
    const api = makeMockApi([makeFeedPost('at://post/2', 'did:bob')])
    queryClient.setQueryData(QUERY_KEY, makePageData(existing, api))

    await fetchLatestItems(queryClient, QUERY_KEY)
    expect(api.fetch).toHaveBeenCalledWith({cursor: undefined, limit: 30})
  })

  it('returns all items when cache page 0 is empty', async () => {
    const apiResult = [
      makeFeedPost('at://post/1', 'did:alice'),
      makeFeedPost('at://post/2', 'did:bob'),
    ]
    const api = makeMockApi(apiResult)
    queryClient.setQueryData(QUERY_KEY, makePageData([], api))

    const result = await fetchLatestItems(queryClient, QUERY_KEY)
    expect(result).toHaveLength(2)
  })
})
