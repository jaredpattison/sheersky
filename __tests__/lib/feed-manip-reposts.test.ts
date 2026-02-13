import {type AppBskyFeedDefs} from '@atproto/api'

jest.mock('../../src/types/bsky', () => ({
  ...jest.requireActual('../../src/types/bsky'),
  validate: () => true,
}))

import {FeedTuner, FeedViewPostsSlice} from '../../src/lib/api/feed-manip'

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

function makeRepostFeedPost(
  postUri: string,
  postAuthorDid: string,
  reposterDid: string,
): AppBskyFeedDefs.FeedViewPost {
  return {
    post: makePostView(postUri, postAuthorDid),
    reason: {
      $type: 'app.bsky.feed.defs#reasonRepost',
      by: {
        $type: 'app.bsky.actor.defs#profileViewBasic',
        did: reposterDid,
        handle: `${reposterDid}.test`,
      },
      indexedAt: new Date().toISOString(),
    },
  }
}

function makeOriginalFeedPost(
  postUri: string,
  authorDid: string,
): AppBskyFeedDefs.FeedViewPost {
  return {
    post: makePostView(postUri, authorDid),
  }
}

function toSlices(
  feedPosts: AppBskyFeedDefs.FeedViewPost[],
): FeedViewPostsSlice[] {
  return feedPosts
    .map(fp => new FeedViewPostsSlice(fp))
    .filter(s => s.items.length > 0)
}

describe('FeedTuner.hideRepostsFrom', () => {
  it('removes reposts from a hidden DID', () => {
    const tuner = new FeedTuner([])
    const slices = toSlices([
      makeRepostFeedPost('at://carol/post/1', 'did:carol', 'did:alice'),
      makeOriginalFeedPost('at://bob/post/2', 'did:bob'),
    ])

    const hidden = new Set(['did:alice'])
    const result = FeedTuner.hideRepostsFrom(hidden)(tuner, slices, false)

    expect(result).toHaveLength(1)
    expect(result[0]._feedPost.post.uri).toBe('at://bob/post/2')
  })

  it('keeps reposts from non-hidden DIDs', () => {
    const tuner = new FeedTuner([])
    const slices = toSlices([
      makeRepostFeedPost('at://carol/post/1', 'did:carol', 'did:alice'),
      makeRepostFeedPost('at://carol/post/2', 'did:carol', 'did:bob'),
    ])

    const hidden = new Set(['did:alice'])
    const result = FeedTuner.hideRepostsFrom(hidden)(tuner, slices, false)

    expect(result).toHaveLength(1)
    expect(result[0]._feedPost.reason).toBeDefined()
    const reason = result[0]._feedPost.reason as any
    expect(reason.by.did).toBe('did:bob')
  })

  it('does not affect original posts from hidden DIDs', () => {
    const tuner = new FeedTuner([])
    const slices = toSlices([
      makeOriginalFeedPost('at://alice/post/1', 'did:alice'),
      makeRepostFeedPost('at://carol/post/2', 'did:carol', 'did:alice'),
    ])

    const hidden = new Set(['did:alice'])
    const result = FeedTuner.hideRepostsFrom(hidden)(tuner, slices, false)

    expect(result).toHaveLength(1)
    expect(result[0]._feedPost.post.uri).toBe('at://alice/post/1')
  })

  it('handles empty hidden set as no-op', () => {
    const tuner = new FeedTuner([])
    const slices = toSlices([
      makeRepostFeedPost('at://carol/post/1', 'did:carol', 'did:alice'),
    ])

    const hidden = new Set<string>()
    const result = FeedTuner.hideRepostsFrom(hidden)(tuner, slices, false)

    expect(result).toHaveLength(1)
  })

  it('does not mutate in dryRun mode', () => {
    const tuner = new FeedTuner([])
    const slices = toSlices([
      makeRepostFeedPost('at://carol/post/1', 'did:carol', 'did:alice'),
      makeOriginalFeedPost('at://bob/post/2', 'did:bob'),
    ])

    const hidden = new Set(['did:alice'])
    // dryRun should still filter
    const result = FeedTuner.hideRepostsFrom(hidden)(tuner, slices, true)

    expect(result).toHaveLength(1)
  })
})

describe('FeedTuner.dedupReposts', () => {
  it('removes duplicate reposts of the same post', () => {
    const tuner = new FeedTuner([])
    const slices = toSlices([
      makeRepostFeedPost('at://carol/post/1', 'did:carol', 'did:alice'),
      makeRepostFeedPost('at://carol/post/1', 'did:carol', 'did:bob'),
    ])

    const result = FeedTuner.dedupReposts(tuner, slices, false)

    expect(result).toHaveLength(1)
    const reason = result[0]._feedPost.reason as any
    expect(reason.by.did).toBe('did:alice')
  })

  it('keeps the first occurrence when original post comes before repost', () => {
    const tuner = new FeedTuner([])
    const slices = toSlices([
      makeOriginalFeedPost('at://carol/post/1', 'did:carol'),
      makeRepostFeedPost('at://carol/post/1', 'did:carol', 'did:alice'),
    ])

    const result = FeedTuner.dedupReposts(tuner, slices, false)

    expect(result).toHaveLength(1)
    expect(result[0]._feedPost.reason).toBeUndefined()
  })

  it('keeps original post even after a repost of it was seen', () => {
    const tuner = new FeedTuner([])
    const slices = toSlices([
      makeRepostFeedPost('at://carol/post/1', 'did:carol', 'did:alice'),
      makeOriginalFeedPost('at://carol/post/1', 'did:carol'),
    ])

    const result = FeedTuner.dedupReposts(tuner, slices, false)

    // Both should remain: repost shown first, original is not a repost so not filtered
    expect(result).toHaveLength(2)
  })

  it('does not deduplicate different posts', () => {
    const tuner = new FeedTuner([])
    const slices = toSlices([
      makeRepostFeedPost('at://carol/post/1', 'did:carol', 'did:alice'),
      makeRepostFeedPost('at://carol/post/2', 'did:carol', 'did:bob'),
    ])

    const result = FeedTuner.dedupReposts(tuner, slices, false)

    expect(result).toHaveLength(2)
  })

  it('persists state across calls for pagination', () => {
    const tuner = new FeedTuner([])

    // First page
    const page1 = toSlices([
      makeRepostFeedPost('at://carol/post/1', 'did:carol', 'did:alice'),
    ])
    FeedTuner.dedupReposts(tuner, page1, false)

    // Second page has another repost of the same post
    const page2 = toSlices([
      makeRepostFeedPost('at://carol/post/1', 'did:carol', 'did:bob'),
    ])
    const result = FeedTuner.dedupReposts(tuner, page2, false)

    expect(result).toHaveLength(0)
  })

  it('does not track URIs in dryRun mode', () => {
    const tuner = new FeedTuner([])

    const slices1 = toSlices([
      makeRepostFeedPost('at://carol/post/1', 'did:carol', 'did:alice'),
    ])
    FeedTuner.dedupReposts(tuner, slices1, true)

    // Same post should not be deduped because dryRun didn't track it
    const slices2 = toSlices([
      makeRepostFeedPost('at://carol/post/1', 'did:carol', 'did:bob'),
    ])
    const result = FeedTuner.dedupReposts(tuner, slices2, false)

    expect(result).toHaveLength(1)
  })
})
