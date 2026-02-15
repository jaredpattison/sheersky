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
import {ScrollView} from '#/view/com/util/Views'
import * as Layout from '#/components/Layout'
import {ViewHeader} from '../com/util/ViewHeader'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PrivacyPolicy'>
export const PrivacyPolicyScreen = (_props: Props) => {
  const pal = usePalette('default')
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <Layout.Screen>
      <ViewHeader title={_(msg`Privacy Policy`)} />
      <ScrollView style={[s.hContentRegion, pal.view]}>
        <View style={[s.p20]}>
          <Text type="title-lg" style={[pal.text, {marginBottom: 16}]}>
            <Trans>Privacy Policy</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              SheerSky is a third-party client for the AT Protocol network. This
              policy describes how SheerSky handles your data.
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>Data We Collect</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              SheerSky stores your preferences and settings locally on your
              device. Your account credentials are used only to authenticate
              with your AT Protocol hosting provider (PDS).
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>Network Data</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              Your posts, profile, social graph, and other content are stored on
              the AT Protocol network by your hosting provider. SheerSky does
              not operate servers that store your content. If you use Bluesky's
              hosting at bsky.social, their Privacy Policy governs your network
              data.
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>Analytics</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              SheerSky may collect anonymous usage analytics to improve the app
              experience. No personally identifiable information is shared with
              third parties.
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>Third-Party Services</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              SheerSky connects to AT Protocol services to provide its
              functionality. These services have their own privacy policies that
              apply to the data they process.
            </Trans>
          </Text>
        </View>
        <View style={s.footerSpacer} />
      </ScrollView>
    </Layout.Screen>
  )
}
