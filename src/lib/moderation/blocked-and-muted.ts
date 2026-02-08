import type * as bsky from '#/types/bsky'

export function isBlockedOrBlocking(profile: bsky.profile.AnyProfileView) {
  return profile.viewer?.blockedBy || profile.viewer?.blocking
}

export function isBlockingUser(profile: bsky.profile.AnyProfileView) {
  return !!(profile.viewer?.blocking || profile.viewer?.blockingByList)
}

export function isBlockedByUser(profile: bsky.profile.AnyProfileView) {
  return !!profile.viewer?.blockedBy
}

export function isMuted(profile: bsky.profile.AnyProfileView) {
  return profile.viewer?.muted || profile.viewer?.mutedByList
}
