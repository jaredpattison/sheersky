import {Platform, ScrollView, View} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import * as toast from '#/components/Toast'
import {Text} from '#/components/Typography'

const MONO_FONT = Platform.OS === 'android' ? 'monospace' : 'Courier New'

export function CodeBlock({code, language}: {code: string; language?: string}) {
  const t = useTheme()
  const {_} = useLingui()

  const onCopy = () => {
    void Clipboard.setStringAsync(code)
    toast.show(_(msg`Copied to clipboard`), {type: 'success'})
  }

  return (
    <View
      style={[
        t.atoms.bg_contrast_100,
        a.rounded_sm,
        a.overflow_hidden,
        a.my_xs,
      ]}>
      <View
        style={[
          a.flex_row,
          a.justify_between,
          a.align_center,
          a.px_sm,
          a.pt_xs,
        ]}>
        <Text
          style={[
            a.text_xs,
            t.atoms.text_contrast_medium,
            {fontFamily: MONO_FONT},
            !language && {opacity: 0},
          ]}>
          {language || ' '}
        </Text>
        <Button
          label={_(msg`Copy code`)}
          onPress={onCopy}
          size="tiny"
          variant="ghost"
          color="secondary"
          shape="round">
          <ButtonIcon icon={ClipboardIcon} />
        </Button>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        style={[a.px_md, a.pb_md, web({overflowX: 'auto' as any})]}>
        <Text
          selectable
          style={[
            {fontFamily: MONO_FONT, fontSize: 13, lineHeight: 20},
            t.atoms.text,
          ]}>
          {code}
        </Text>
      </ScrollView>
    </View>
  )
}
