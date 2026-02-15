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

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'CommunityGuidelines'
>
export const CommunityGuidelinesScreen = (_props: Props) => {
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
      <ViewHeader title={_(msg`Community Guidelines`)} />
      <ScrollView style={[s.hContentRegion, pal.view]}>
        <View style={[s.p20]}>
          <Text type="title-lg" style={[pal.text, {marginBottom: 16}]}>
            <Trans>Community Guidelines</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              SheerSky is a client for the AT Protocol network. Content
              moderation is enforced at the network level by moderation
              services. The following guidelines reflect the expectations for
              all users on the network.
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>Be Respectful</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              Treat others with respect. Harassment, hate speech, threats, and
              targeted abuse are not tolerated on the network.
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>No Illegal Content</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              Do not post content that is illegal, including child exploitation
              material, non-consensual intimate images, or content that
              facilitates violence.
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>Label Sensitive Content</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              Use content labels appropriately for adult or sensitive content.
              This helps other users control what they see in their feeds.
            </Trans>
          </Text>
          <Text type="title" style={[pal.text, {marginBottom: 8}]}>
            <Trans>Reporting</Trans>
          </Text>
          <Text style={[pal.text, {marginBottom: 12, lineHeight: 22}]}>
            <Trans>
              If you encounter content that violates these guidelines, use the
              report function. Reports are processed by the network's moderation
              services.
            </Trans>
          </Text>
        </View>
        <View style={s.footerSpacer} />
      </ScrollView>
    </Layout.Screen>
  )
}
