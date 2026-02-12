import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {useSession} from '#/state/session'
import {UserInfoText} from '#/view/com/util/UserInfoText'
import {atoms as a, useTheme} from '#/alf'
import {ArrowCornerDownRight_Stroke2_Corner2_Rounded as ArrowCornerDownRightIcon} from '#/components/icons/ArrowCornerDownRight'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

export function PostRepliedTo({
  parentAuthor,
  isParentBlocked,
  isParentNotFound,
  parentDid,
}: {
  parentAuthor: string | bsky.profile.AnyProfileView | undefined
  isParentBlocked?: boolean
  isParentNotFound?: boolean
  parentDid?: string
}) {
  const t = useTheme()
  const {currentAccount} = useSession()

  const textStyle = [a.text_sm, t.atoms.text_contrast_medium, a.leading_snug]

  let label
  if (isParentBlocked && parentDid) {
    // Soft block: show the blocked parent author's name
    label = (
      <Trans context="description">
        Replied to{' '}
        <ProfileHoverCard did={parentDid}>
          <UserInfoText did={parentDid} attr="displayName" style={textStyle} />
        </ProfileHoverCard>
      </Trans>
    )
  } else if (isParentBlocked) {
    label = (
      <Trans context="description">
        Replied to a post that could not be loaded
      </Trans>
    )
  } else if (isParentNotFound) {
    label = <Trans context="description">Replied to a post</Trans>
  } else if (parentAuthor) {
    const did =
      typeof parentAuthor === 'string' ? parentAuthor : parentAuthor.did
    const isMe = currentAccount?.did === did
    if (isMe) {
      label = <Trans context="description">Replied to you</Trans>
    } else {
      label = (
        <Trans context="description">
          Replied to{' '}
          <ProfileHoverCard did={did}>
            <UserInfoText did={did} attr="displayName" style={textStyle} />
          </ProfileHoverCard>
        </Trans>
      )
    }
  }

  if (!label) {
    // Should not happen.
    return null
  }

  return (
    <View style={[a.flex_row, a.align_center, a.pb_xs, a.gap_xs]}>
      <ArrowCornerDownRightIcon
        size="xs"
        style={[t.atoms.text_contrast_medium, {top: -1}]}
      />
      <Text style={[a.flex_1, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}
