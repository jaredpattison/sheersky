import {useState} from 'react'
import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQuery} from '@tanstack/react-query'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {
  useHiddenRepostDids,
  useHiddenRepostDidsApi,
} from '#/state/preferences/hidden-reposts'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  usePreferencesQuery,
  useSetFeedViewPreferencesMutation,
} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {Beaker_Stroke2_Corner2_Rounded as BeakerIcon} from '#/components/icons/Beaker'
import {Bubbles_Stroke2_Corner2_Rounded as BubblesIcon} from '#/components/icons/Bubble'
import {CircleX_Stroke2_Corner0_Rounded as CircleXIcon} from '#/components/icons/CircleX'
import {CloseQuote_Stroke2_Corner1_Rounded as QuoteIcon} from '#/components/icons/Quote'
import {Repost_Stroke2_Corner2_Rounded as RepostIcon} from '#/components/icons/Repost'
import * as Layout from '#/components/Layout'
import * as ProfileCard from '#/components/ProfileCard'
import * as SettingsList from './components/SettingsList'

const INITIAL_SHOW_COUNT = 5

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'PreferencesFollowingFeed'
>
export function FollowingFeedPreferencesScreen({}: Props) {
  const {_} = useLingui()

  const {data: preferences} = usePreferencesQuery()
  const {mutate: setFeedViewPref, variables} =
    useSetFeedViewPreferencesMutation()

  const hiddenRepostDids = useHiddenRepostDids()
  const {showReposts: unhideReposts} = useHiddenRepostDidsApi()

  const showReplies = !(
    variables?.hideReplies ?? preferences?.feedViewPrefs?.hideReplies
  )

  const showReposts = !(
    variables?.hideReposts ?? preferences?.feedViewPrefs?.hideReposts
  )

  const showQuotePosts = !(
    variables?.hideQuotePosts ?? preferences?.feedViewPrefs?.hideQuotePosts
  )

  const mergeFeedEnabled = Boolean(
    variables?.lab_mergeFeedEnabled ??
      preferences?.feedViewPrefs?.lab_mergeFeedEnabled,
  )

  const hasHiddenRepostAccounts =
    hiddenRepostDids && hiddenRepostDids.length > 0

  return (
    <Layout.Screen testID="followingFeedPreferencesScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Following Feed Preferences</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Item>
            <Admonition type="tip" style={[a.flex_1]}>
              <Trans>These settings only apply to the Following feed.</Trans>
            </Admonition>
          </SettingsList.Item>
          <Toggle.Item
            type="checkbox"
            name="show-replies"
            label={_(msg`Show replies`)}
            value={showReplies}
            onChange={value =>
              setFeedViewPref({
                hideReplies: !value,
              })
            }>
            <SettingsList.Item>
              <SettingsList.ItemIcon icon={BubblesIcon} />
              <SettingsList.ItemText>
                <Trans>Show replies</Trans>
              </SettingsList.ItemText>
              <Toggle.Platform />
            </SettingsList.Item>
          </Toggle.Item>
          <Toggle.Item
            type="checkbox"
            name="show-reposts"
            label={_(msg`Show reposts`)}
            value={showReposts}
            onChange={value =>
              setFeedViewPref({
                hideReposts: !value,
              })
            }>
            <SettingsList.Item>
              <SettingsList.ItemIcon icon={RepostIcon} />
              <SettingsList.ItemText>
                <Trans>Show reposts</Trans>
              </SettingsList.ItemText>
              <Toggle.Platform />
            </SettingsList.Item>
          </Toggle.Item>
          <Toggle.Item
            type="checkbox"
            name="show-quotes"
            label={_(msg`Show quote posts`)}
            value={showQuotePosts}
            onChange={value =>
              setFeedViewPref({
                hideQuotePosts: !value,
              })
            }>
            <SettingsList.Item>
              <SettingsList.ItemIcon icon={QuoteIcon} />
              <SettingsList.ItemText>
                <Trans>Show quote posts</Trans>
              </SettingsList.ItemText>
              <Toggle.Platform />
            </SettingsList.Item>
          </Toggle.Item>
          {hasHiddenRepostAccounts && (
            <>
              <SettingsList.Divider />
              <SettingsList.Item>
                <SettingsList.ItemIcon icon={RepostIcon} />
                <SettingsList.ItemText>
                  <Trans>Hidden repost accounts</Trans>
                </SettingsList.ItemText>
              </SettingsList.Item>
              <HiddenRepostAccountsList
                dids={hiddenRepostDids}
                onUnhide={unhideReposts}
              />
            </>
          )}
          <SettingsList.Divider />
          <SettingsList.Group>
            <SettingsList.ItemIcon icon={BeakerIcon} />
            <SettingsList.ItemText>
              <Trans>Experimental</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              type="checkbox"
              name="merge-feed"
              label={_(
                msg`Show samples of your saved feeds in your Following feed`,
              )}
              value={mergeFeedEnabled}
              onChange={value =>
                setFeedViewPref({
                  lab_mergeFeedEnabled: value,
                })
              }
              style={[a.w_full, a.gap_md]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>
                  Show samples of your saved feeds in your Following feed
                </Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

function useChunkedProfilesQuery(dids: string[]) {
  const agent = useAgent()
  return useQuery({
    queryKey: ['hidden-repost-profiles', ...dids],
    queryFn: async () => {
      const chunks: string[][] = []
      for (let i = 0; i < dids.length; i += 25) {
        chunks.push(dids.slice(i, i + 25))
      }
      const results = await Promise.all(
        chunks.map(chunk => agent.getProfiles({actors: chunk})),
      )
      return results.flatMap(r => r.data.profiles)
    },
    enabled: dids.length > 0,
  })
}

function HiddenRepostAccountsList({
  dids,
  onUnhide,
}: {
  dids: string[]
  onUnhide: (did: string) => void
}) {
  const {_} = useLingui()
  const {data: profiles} = useChunkedProfilesQuery(dids)
  const moderationOpts = useModerationOpts()
  const [showAll, setShowAll] = useState(false)

  if (!profiles || !moderationOpts) return null

  const visibleProfiles = showAll
    ? profiles
    : profiles.slice(0, INITIAL_SHOW_COUNT)
  const hiddenCount = profiles.length - INITIAL_SHOW_COUNT

  return (
    <>
      {visibleProfiles.map(profile => (
        <HiddenRepostAccountRow
          key={profile.did}
          profile={profile}
          moderationOpts={moderationOpts}
          onUnhide={onUnhide}
        />
      ))}
      {!showAll && hiddenCount > 0 && (
        <SettingsList.Item>
          <Button
            label={_(msg`Show ${hiddenCount} more`)}
            size="small"
            color="secondary"
            variant="ghost"
            onPress={() => setShowAll(true)}
            style={[a.w_full]}>
            <ButtonText>
              {_(
                plural(hiddenCount, {
                  one: 'Show # more account',
                  other: 'Show all # accounts',
                }),
              )}
            </ButtonText>
          </Button>
        </SettingsList.Item>
      )}
    </>
  )
}

function HiddenRepostAccountRow({
  profile,
  moderationOpts,
  onUnhide,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  moderationOpts: ReturnType<typeof useModerationOpts> & {}
  onUnhide: (did: string) => void
}) {
  const {_} = useLingui()

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.px_xl,
        a.py_sm,
        a.gap_sm,
        {minHeight: 48},
      ]}>
      <View style={[a.flex_1]}>
        <ProfileCard.Link profile={profile}>
          <ProfileCard.Outer>
            <ProfileCard.Header>
              <ProfileCard.Avatar
                profile={profile}
                moderationOpts={moderationOpts}
                size={32}
              />
              <ProfileCard.NameAndHandle
                profile={profile}
                moderationOpts={moderationOpts}
              />
            </ProfileCard.Header>
          </ProfileCard.Outer>
        </ProfileCard.Link>
      </View>
      <Button
        label={_(msg`Show reposts from this user`)}
        size="tiny"
        color="secondary"
        shape="round"
        onPress={() => onUnhide(profile.did)}>
        <ButtonIcon icon={CircleXIcon} />
      </Button>
    </View>
  )
}
