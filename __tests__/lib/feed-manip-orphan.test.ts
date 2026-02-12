import {type AppBskyFeedDefs} from '@atproto/api'

// Mock bsky.validate to always return true — the actual validator has
// issues in the jest-expo transform environment
jest.mock('../../src/types/bsky', () => ({
  ...jest.requireActual('../../src/types/bsky'),
  validate: () => true,
}))

import {FeedViewPostsSlice} from '../../src/lib/api/feed-manip'

// A valid CID is required to pass AppBskyFeedPost.validateRecord
const VALID_CID = 'bafyreig6fcr7pxa4gj5tu4jkbqbu37yaxqnxfjntbknbyomu6pjn3f5mqy'

function makePostRecord(replyRef?: {parentUri: string; rootUri: string}) {
  const record: any = {
    $type: 'app.bsky.feed.post',
    text: 'test post',
    createdAt: new Date().toISOString(),
  }
  if (replyRef) {
    record.reply = {
      parent: {uri: replyRef.parentUri, cid: VALID_CID},
      root: {uri: replyRef.rootUri, cid: VALID_CID},
    }
  }
  return record
}

function makePostView(
  uri: string,
  did: string,
  replyRef?: {parentUri: string; rootUri: string},
): AppBskyFeedDefs.PostView {
  return {
    $type: 'app.bsky.feed.defs#postView',
    uri,
    cid: VALID_CID,
    author: {
      $type: 'app.bsky.actor.defs#profileViewBasic',
      did,
      handle: `${did}.test`,
    },
    record: makePostRecord(replyRef),
    indexedAt: new Date().toISOString(),
  }
}

function makeBlockedPost(
  uri: string,
  did: string,
): AppBskyFeedDefs.BlockedPost {
  return {
    $type: 'app.bsky.feed.defs#blockedPost',
    uri,
    blocked: true,
    author: {
      $type: 'app.bsky.feed.defs#blockedAuthor',
      did,
    },
  }
}

function makeNotFoundPost(uri: string): AppBskyFeedDefs.NotFoundPost {
  return {
    $type: 'app.bsky.feed.defs#notFoundPost',
    uri,
    notFound: true,
  }
}

describe('FeedViewPostsSlice orphan handling', () => {
  describe('blocked parent', () => {
    it('does NOT mark as orphan when parent is BlockedPost', () => {
      const blockedParentUri = 'at://did:plc:blocker/app.bsky.feed.post/2'
      const rootUri = 'at://did:plc:blocker/app.bsky.feed.post/2'
      const post = makePostView(
        'at://did:plc:child/app.bsky.feed.post/1',
        'did:plc:child',
        {parentUri: blockedParentUri, rootUri},
      )
      const blockedParent = makeBlockedPost(blockedParentUri, 'did:plc:blocker')

      const feedPost: AppBskyFeedDefs.FeedViewPost = {
        post,
        reply: {
          parent: blockedParent,
          root: blockedParent,
        },
      }

      const slice = new FeedViewPostsSlice(feedPost)
      expect(slice.isOrphan).toBe(false)
      expect(slice.items.length).toBeGreaterThan(0)
    })

    it('preserves parentUri and parentDid from BlockedPost', () => {
      const blockedParentUri = 'at://did:plc:blocker/app.bsky.feed.post/2'
      const post = makePostView(
        'at://did:plc:child/app.bsky.feed.post/1',
        'did:plc:child',
        {parentUri: blockedParentUri, rootUri: blockedParentUri},
      )
      const blockedParent = makeBlockedPost(blockedParentUri, 'did:plc:blocker')

      const feedPost: AppBskyFeedDefs.FeedViewPost = {
        post,
        reply: {
          parent: blockedParent,
          root: blockedParent,
        },
      }

      const slice = new FeedViewPostsSlice(feedPost)
      // The first (and only) item should be the child post
      expect(slice.items).toHaveLength(1)
      const childItem = slice.items[0]
      expect(childItem.post.uri).toBe(post.uri)
      expect(childItem.isParentBlocked).toBe(true)
      expect(childItem.parentUri).toBe(blockedParentUri)
      expect(childItem.parentDid).toBe('did:plc:blocker')
    })

    it('does not set parentUri/parentDid when parent is a normal PostView', () => {
      const parentUri = 'at://did:plc:parent/app.bsky.feed.post/2'
      const parent = makePostView(parentUri, 'did:plc:parent')
      const post = makePostView(
        'at://did:plc:child/app.bsky.feed.post/1',
        'did:plc:child',
        {parentUri, rootUri: parentUri},
      )

      const feedPost: AppBskyFeedDefs.FeedViewPost = {
        post,
        reply: {
          parent,
          root: parent,
        },
      }

      const slice = new FeedViewPostsSlice(feedPost)
      // With parent as root, items should be [parent, child]
      const childItem = slice.items.find(item => item.post.uri === post.uri)
      expect(childItem).toBeDefined()
      expect(childItem!.isParentBlocked).toBe(false)
      expect(childItem!.parentUri).toBeUndefined()
      expect(childItem!.parentDid).toBeUndefined()
    })
  })

  describe('not-found parent', () => {
    it('DOES mark as orphan when parent is NotFoundPost', () => {
      const notFoundUri = 'at://did:plc:gone/app.bsky.feed.post/2'
      const post = makePostView(
        'at://did:plc:child/app.bsky.feed.post/1',
        'did:plc:child',
        {parentUri: notFoundUri, rootUri: notFoundUri},
      )
      const notFoundParent = makeNotFoundPost(notFoundUri)

      const feedPost: AppBskyFeedDefs.FeedViewPost = {
        post,
        reply: {
          parent: notFoundParent,
          root: notFoundParent,
        },
      }

      const slice = new FeedViewPostsSlice(feedPost)
      expect(slice.isOrphan).toBe(true)
    })
  })

  describe('blocked root', () => {
    it('does NOT mark as orphan when root is BlockedPost but parent is valid', () => {
      const blockedRootUri = 'at://did:plc:blocker/app.bsky.feed.post/1'
      const parentUri = 'at://did:plc:parent/app.bsky.feed.post/2'
      const parent = makePostView(parentUri, 'did:plc:parent', {
        parentUri: blockedRootUri,
        rootUri: blockedRootUri,
      })
      const post = makePostView(
        'at://did:plc:child/app.bsky.feed.post/3',
        'did:plc:child',
        {parentUri, rootUri: blockedRootUri},
      )
      const blockedRoot = makeBlockedPost(blockedRootUri, 'did:plc:blocker')

      const feedPost: AppBskyFeedDefs.FeedViewPost = {
        post,
        reply: {
          parent,
          root: blockedRoot,
          grandparentAuthor: undefined,
        },
      }

      const slice = new FeedViewPostsSlice(feedPost)
      expect(slice.isOrphan).toBe(false)
    })
  })

  describe('no reply context', () => {
    it('does not mark top-level post as orphan', () => {
      const post = makePostView(
        'at://did:plc:user/app.bsky.feed.post/1',
        'did:plc:user',
      )

      const feedPost: AppBskyFeedDefs.FeedViewPost = {post}
      const slice = new FeedViewPostsSlice(feedPost)
      expect(slice.isOrphan).toBe(false)
      expect(slice.items).toHaveLength(1)
    })
  })
})
