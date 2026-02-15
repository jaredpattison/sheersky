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

type Props = NativeStackScreenProps<CommonNavigatorParams, 'CopyrightPolicy'>
export const CopyrightPolicyScreen = (_props: Props) => {
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
      <ViewHeader title={_(msg`Copyright Policy`)} />
      <ScrollView style={[s.hContentRegion, pal.view]}>
        <View style={[s.p20]}>
          <Text type="title-lg" style={[pal.text, {marginBottom: 16}]}>
            <Trans>Copyright Policy</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              SheerSky respects intellectual property rights. Copyright
              enforcement on the AT Protocol network is handled by moderation
              services.
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>DMCA Notices</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              If you believe content on the network infringes your copyright,
              you can submit a report through the app's reporting feature. DMCA
              takedown requests for content hosted on the Bluesky network are
              processed by Bluesky's moderation team.
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>Counter-Notices</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              If you believe content was removed in error, you may submit a
              counter-notice through the network's moderation services.
            </Trans>
          </Text>
        </View>
        <View style={s.footerSpacer} />
      </ScrollView>
    </Layout.Screen>
  )
}
