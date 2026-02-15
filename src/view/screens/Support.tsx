import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {usePalette} from '#/lib/hooks/usePalette'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {useSetMinimalShellMode} from '#/state/shell'
import {Text} from '#/view/com/util/text/Text'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {ScrollView} from '#/view/com/util/Views'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Support'>
export const SupportScreen = (_props: Props) => {
  const pal = usePalette('default')
  const setMinimalShellMode = useSetMinimalShellMode()
  const {_} = useLingui()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <Layout.Screen>
      <ViewHeader title={_(msg`Support`)} />
      <ScrollView style={[s.hContentRegion, pal.view]}>
        <View style={[s.p20]}>
          <Text type="title-lg" style={[pal.text, {marginBottom: 16}]}>
            <Trans>Support</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              SheerSky is a third-party client for the AT Protocol network
              (Bluesky).
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>App Issues</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              For issues specific to the SheerSky app (crashes, bugs, feature
              requests), please report them through the app's feedback option or
              contact us directly.
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>Account Issues</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              For account-related issues (login problems, account recovery,
              moderation appeals), contact your hosting provider. If your
              account is hosted on bsky.social, visit Bluesky's support page.
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>Content Reports</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              To report content that violates community guidelines, use the
              report button on any post or profile. Reports are handled by the
              network's moderation services.
            </Trans>
          </Text>
        </View>
        <View style={s.footerSpacer} />
      </ScrollView>
    </Layout.Screen>
  )
}
