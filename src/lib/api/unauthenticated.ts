import {
  type $Typed,
  AppBskyFeedDefs,
  type AppBskyFeedGetPosts,
  type AppBskyFeedGetPostThread,
  type AppBskyUnspeccedDefs,
  type AppBskyUnspeccedGetPostThreadV2,
  BskyAgent,
  jsonStringToLex,
} from '@atproto/api'

const BSKY_PUBLIC_API = 'https://api.bsky.app/xrpc'

function labelerHeaders() {
  return {
    'atproto-accept-labelers': BskyAgent.appLabelers
      .map(l => `${l};redact`)
      .join(', '),
  }
}

/**
 * Fetch a post thread via unauthenticated public API.
 * Used as a fallback when the authenticated API fails due to blocks.
 */
export async function fetchUnauthenticatedThread(
  uri: string,
  opts?: {depth?: number; parentHeight?: number},
): Promise<AppBskyFeedGetPostThread.OutputSchema | null> {
  try {
    const params = new URLSearchParams({
      uri,
      depth: String(opts?.depth ?? 6),
      parentHeight: String(opts?.parentHeight ?? 10),
    })

    const res = await fetch(
      `${BSKY_PUBLIC_API}/app.bsky.feed.getPostThread?${params.toString()}`,
      {
        method: 'GET',
        headers: labelerHeaders(),
      },
    )

    if (!res.ok) return null

    return jsonStringToLex(
      await res.text(),
    ) as AppBskyFeedGetPostThread.OutputSchema
  } catch {
    return null
  }
}

/**
 * Fetch posts by URI via unauthenticated public API.
 * Max 25 URIs per request.
 */
export async function fetchUnauthenticatedPosts(
  uris: string[],
): Promise<AppBskyFeedGetPosts.OutputSchema | null> {
  try {
    const params = new URLSearchParams()
    for (const uri of uris.slice(0, 25)) {
      params.append('uris', uri)
    }

    const res = await fetch(
      `${BSKY_PUBLIC_API}/app.bsky.feed.getPosts?${params.toString()}`,
      {
        method: 'GET',
        headers: labelerHeaders(),
      },
    )

    if (!res.ok) return null

    return jsonStringToLex(await res.text()) as AppBskyFeedGetPosts.OutputSchema
  } catch {
    return null
  }
}

type V2ThreadItem = $Typed<
  Omit<AppBskyUnspeccedGetPostThreadV2.ThreadItem, 'value'> & {
    value: $Typed<AppBskyUnspeccedDefs.ThreadItemPost>
  }
>

/**
 * Convert a V1 recursive ThreadViewPost tree into a flat V2 ThreadItem array.
 * Walks parent chain upward (negative depths), anchor at depth 0,
 * then replies downward (positive depths).
 */
export function convertV1ThreadToV2Items(
  thread: AppBskyFeedDefs.ThreadViewPost,
  _anchorUri: string,
): AppBskyUnspeccedGetPostThreadV2.ThreadItem[] {
  const items: AppBskyUnspeccedGetPostThreadV2.ThreadItem[] = []

  // Collect parent chain
  const parents: AppBskyFeedDefs.ThreadViewPost[] = []
  let current = thread.parent
  while (current && AppBskyFeedDefs.isThreadViewPost(current)) {
    parents.push(current as AppBskyFeedDefs.ThreadViewPost)
    current = (current as AppBskyFeedDefs.ThreadViewPost).parent
  }

  // Parents in ascending order (most distant first)
  parents.reverse()
  for (let i = 0; i < parents.length; i++) {
    const depth = -(parents.length - i)
    items.push(postViewToV2Item(parents[i].post, depth, i === 0))
  }

  // Anchor at depth 0
  items.push(postViewToV2Item(thread.post, 0, parents.length === 0))

  // Walk replies downward
  if (thread.replies) {
    walkReplies(thread.replies, 1, items)
  }

  return items
}

function postViewToV2Item(
  post: AppBskyFeedDefs.PostView,
  depth: number,
  moreParents: boolean,
): V2ThreadItem {
  return {
    $type: 'app.bsky.unspecced.getPostThreadV2#threadItem',
    uri: post.uri,
    depth,
    value: {
      $type: 'app.bsky.unspecced.defs#threadItemPost',
      post,
      opThread: false,
      moreParents: depth < 0 && moreParents,
      moreReplies: 0,
      hiddenByThreadgate: false,
      mutedByViewer: false,
    },
  }
}

function walkReplies(
  replies: NonNullable<AppBskyFeedDefs.ThreadViewPost['replies']>,
  depth: number,
  items: AppBskyUnspeccedGetPostThreadV2.ThreadItem[],
) {
  for (const reply of replies) {
    if (AppBskyFeedDefs.isThreadViewPost(reply)) {
      const tvp = reply as AppBskyFeedDefs.ThreadViewPost
      items.push(postViewToV2Item(tvp.post, depth, false))
      if (tvp.replies) {
        walkReplies(tvp.replies, depth + 1, items)
      }
    }
    // Skip NotFoundPost and BlockedPost in replies
  }
}

/**
 * Convert a PostView into a V2 ThreadItem suitable for replacing
 * a blocked placeholder in thread data.
 */
export function postViewToV2ThreadItem(
  post: AppBskyFeedDefs.PostView,
  depth: number,
): V2ThreadItem {
  return postViewToV2Item(post, depth, false)
}
