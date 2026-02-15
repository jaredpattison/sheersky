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

type Props = NativeStackScreenProps<CommonNavigatorParams, 'TermsOfService'>
export const TermsOfServiceScreen = (_props: Props) => {
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
      <ViewHeader title={_(msg`Terms of Service`)} />
      <ScrollView style={[s.hContentRegion, pal.view]}>
        <View style={[s.p20]}>
          <Text type="title-lg" style={[pal.text, {marginBottom: 16}]}>
            <Trans>Terms of Service</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              SheerSky is a third-party client for the AT Protocol network. By
              using SheerSky, you agree to the following terms.
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>Network Terms</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              SheerSky connects to the Bluesky network via the AT Protocol. Your
              account, data, and content are governed by the terms of your
              hosting provider (PDS). If you use Bluesky's hosting at
              bsky.social, their Terms of Service apply to your account and
              content.
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>Client Usage</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              SheerSky is provided as-is without warranty. We are not
              responsible for content posted by users on the network. The app
              may include features that differ from the official Bluesky client.
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>Content and Moderation</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              Content moderation is handled by the AT Protocol network's
              moderation services. Reports submitted through SheerSky are
              processed by the network's moderation infrastructure.
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>Changes</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              These terms may be updated from time to time. Continued use of
              SheerSky constitutes acceptance of any changes.
            </Trans>
          </Text>
        </View>
        <View style={s.footerSpacer} />
      </ScrollView>
    </Layout.Screen>
  )
}
