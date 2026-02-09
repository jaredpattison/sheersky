import {useState} from 'react'
import {type AppBskyNotificationDeclaration} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {useAppLock, useAppLockApi} from '#/state/preferences'
import {useNotificationDeclarationQuery} from '#/state/queries/activity-subscriptions'
import {useAppPasswordsQuery} from '#/state/queries/app-passwords'
import {useSession} from '#/state/session'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import * as Admonition from '#/components/Admonition'
import * as Toggle from '#/components/forms/Toggle'
import {BellRinging_Stroke2_Corner0_Rounded as BellRingingIcon} from '#/components/icons/BellRinging'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlashIcon} from '#/components/icons/EyeSlash'
import {Key_Stroke2_Corner2_Rounded as KeyIcon} from '#/components/icons/Key'
import {Lock_Stroke2_Corner0_Rounded as LockIcon} from '#/components/icons/Lock'
import {ShieldCheck_Stroke2_Corner0_Rounded as ShieldIcon} from '#/components/icons/Shield'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'
import {isAvailable as isAppLockAvailable} from '../../../modules/expo-app-lock'
import {Email2FAToggle} from './components/Email2FAToggle'
import {PwiOptOut} from './components/PwiOptOut'
import {ItemTextWithSubtitle} from './NotificationSettings/components/ItemTextWithSubtitle'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'PrivacyAndSecuritySettings'
>
export function PrivacyAndSecuritySettingsScreen({}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const {data: appPasswords} = useAppPasswordsQuery()
  const {currentAccount} = useSession()
  const appLock = useAppLock()
  const appLockApi = useAppLockApi()
  const [deviceSupportsLock] = useState(() => IS_NATIVE && isAppLockAvailable())
  const {
    data: notificationDeclaration,
    isPending,
    isError,
  } = useNotificationDeclarationQuery()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Privacy and Security</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Item>
            <SettingsList.ItemIcon
              icon={ShieldIcon}
              color={
                currentAccount?.emailAuthFactor
                  ? t.palette.primary_500
                  : undefined
              }
            />
            <SettingsList.ItemText>
              {currentAccount?.emailAuthFactor ? (
                <Trans>Email 2FA enabled</Trans>
              ) : (
                <Trans>Two-factor authentication (2FA)</Trans>
              )}
            </SettingsList.ItemText>
            <Email2FAToggle />
          </SettingsList.Item>
          <SettingsList.LinkItem
            to="/settings/app-passwords"
            label={_(msg`App passwords`)}>
            <SettingsList.ItemIcon icon={KeyIcon} />
            <SettingsList.ItemText>
              <Trans>App passwords</Trans>
            </SettingsList.ItemText>
            {appPasswords && appPasswords.length > 0 && (
              <SettingsList.BadgeText>
                {appPasswords.length}
              </SettingsList.BadgeText>
            )}
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            label={_(
              msg`Settings for allowing others to be notified of your posts`,
            )}
            to={{screen: 'ActivityPrivacySettings'}}
            contentContainerStyle={[a.align_start]}>
            <SettingsList.ItemIcon icon={BellRingingIcon} />
            <ItemTextWithSubtitle
              titleText={
                <Trans>Allow others to be notified of your posts</Trans>
              }
              subtitleText={
                <NotificationDeclaration
                  data={notificationDeclaration}
                  isError={isError}
                />
              }
              showSkeleton={isPending}
            />
          </SettingsList.LinkItem>
          <SettingsList.Divider />
          <SettingsList.Group>
            <SettingsList.ItemIcon icon={EyeSlashIcon} />
            <SettingsList.ItemText>
              <Trans>Logged-out visibility</Trans>
            </SettingsList.ItemText>
            <PwiOptOut />
          </SettingsList.Group>
          <SettingsList.Item>
            <Admonition.Outer type="tip" style={[a.flex_1]}>
              <Admonition.Row>
                <Admonition.Icon />
                <Admonition.Content>
                  <Admonition.Text>
                    <Trans>
                      Note: SheerSky is an open and public network. This setting
                      only limits the visibility of your content on the SheerSky
                      app and website, and other apps may not respect this
                      setting. Your content may still be shown to logged-out
                      users by other apps and websites.
                    </Trans>
                  </Admonition.Text>
                  <Admonition.Text>
                    <InlineLinkText
                      label={_(
                        msg`Learn more about what is public on SheerSky.`,
                      )}
                      to="/support/privacy">
                      <Trans>
                        Learn more about what is public on SheerSky.
                      </Trans>
                    </InlineLinkText>
                  </Admonition.Text>
                </Admonition.Content>
              </Admonition.Row>
            </Admonition.Outer>
          </SettingsList.Item>
          {deviceSupportsLock && (
            <>
              <SettingsList.Divider />
              <Toggle.Item
                name="app_lock_enabled"
                label={_(msg`Require authentication to open app`)}
                value={appLock.enabled}
                onChange={value => appLockApi.setEnabled(value)}>
                <SettingsList.Item>
                  <SettingsList.ItemIcon icon={LockIcon} />
                  <SettingsList.ItemText>
                    <Trans>App lock</Trans>
                  </SettingsList.ItemText>
                  <Toggle.Platform />
                </SettingsList.Item>
              </Toggle.Item>
              {appLock.enabled && (
                <SettingsList.Item>
                  <Text
                    style={[
                      a.text_sm,
                      a.font_bold,
                      t.atoms.text_contrast_medium,
                      a.pl_md,
                    ]}>
                    <Trans>Auto-lock</Trans>
                  </Text>
                  <Toggle.Item
                    name="auto_lock_0"
                    label={_(msg`Immediately`)}
                    value={appLock.autoLockSeconds === 0}
                    onChange={() => appLockApi.setAutoLockSeconds(0)}>
                    <Toggle.LabelText>
                      <Trans>Immediately</Trans>
                    </Toggle.LabelText>
                    <Toggle.Radio />
                  </Toggle.Item>
                  <Toggle.Item
                    name="auto_lock_30"
                    label={_(msg`After 30 seconds`)}
                    value={appLock.autoLockSeconds === 30}
                    onChange={() => appLockApi.setAutoLockSeconds(30)}>
                    <Toggle.LabelText>
                      <Trans>After 30 seconds</Trans>
                    </Toggle.LabelText>
                    <Toggle.Radio />
                  </Toggle.Item>
                  <Toggle.Item
                    name="auto_lock_60"
                    label={_(msg`After 1 minute`)}
                    value={appLock.autoLockSeconds === 60}
                    onChange={() => appLockApi.setAutoLockSeconds(60)}>
                    <Toggle.LabelText>
                      <Trans>After 1 minute</Trans>
                    </Toggle.LabelText>
                    <Toggle.Radio />
                  </Toggle.Item>
                  <Toggle.Item
                    name="auto_lock_300"
                    label={_(msg`After 5 minutes`)}
                    value={appLock.autoLockSeconds === 300}
                    onChange={() => appLockApi.setAutoLockSeconds(300)}>
                    <Toggle.LabelText>
                      <Trans>After 5 minutes</Trans>
                    </Toggle.LabelText>
                    <Toggle.Radio />
                  </Toggle.Item>
                </SettingsList.Item>
              )}
            </>
          )}
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

function NotificationDeclaration({
  data,
  isError,
}: {
  data?: {
    value: AppBskyNotificationDeclaration.Record
  }
  isError?: boolean
}) {
  if (isError) {
    return <Trans>Error loading preference</Trans>
  }
  switch (data?.value?.allowSubscriptions) {
    case 'mutuals':
      return <Trans>Only followers who I follow</Trans>
    case 'none':
      return <Trans context="enable for">No one</Trans>
    case 'followers':
    default:
      return <Trans>Anyone who follows me</Trans>
  }
}
