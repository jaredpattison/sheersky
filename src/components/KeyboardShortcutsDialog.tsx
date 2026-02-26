import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

function KeyBadge({label}: {label: string}) {
  const t = useTheme()
  return (
    <View
      style={[
        {
          minWidth: 24,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          borderWidth: 1,
        },
        t.atoms.bg_contrast_50,
        t.atoms.border_contrast_low,
        a.align_center,
      ]}>
      {}
      <Text style={[a.text_xs, {fontFamily: 'monospace'}, t.atoms.text]}>
        {label}
      </Text>
    </View>
  )
}

function ShortcutRow({
  keys,
  description,
}: {
  keys: string[]
  description: string
}) {
  const t = useTheme()
  return (
    <View style={[a.flex_row, a.align_center, a.justify_between, a.py_xs]}>
      <Text style={[a.text_sm, t.atoms.text]}>{description}</Text>
      <View style={[a.flex_row, a.gap_xs]}>
        {keys.map((key, i) => (
          <KeyBadge key={i} label={key} />
        ))}
      </View>
    </View>
  )
}

function KeyboardShortcutsInner() {
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const t = useTheme()

  return (
    <Dialog.ScrollableInner label={_(msg`Keyboard Shortcuts`)}>
      <Dialog.Header>
        <Dialog.HeaderText>
          <Trans>Keyboard Shortcuts</Trans>
        </Dialog.HeaderText>
      </Dialog.Header>

      <View style={[a.gap_lg, a.mt_md]}>
        <View style={[a.gap_xs]}>
          <Text
            style={[
              a.text_xs,
              a.font_bold,
              a.pb_2xs,
              t.atoms.text_contrast_medium,
              {textTransform: 'uppercase', letterSpacing: 0.5},
            ]}>
            <Trans>Navigation</Trans>
          </Text>
          <ShortcutRow keys={['g', 'h']} description={_(msg`Go to Home`)} />
          <ShortcutRow
            keys={['g', 'n']}
            description={_(msg`Go to Notifications`)}
          />
          <ShortcutRow keys={['g', 's']} description={_(msg`Go to Search`)} />
          <ShortcutRow keys={['g', 'p']} description={_(msg`Go to Profile`)} />
          <ShortcutRow keys={['g', 'm']} description={_(msg`Go to Messages`)} />
        </View>

        <View style={[a.gap_xs]}>
          <Text
            style={[
              a.text_xs,
              a.font_bold,
              a.pb_2xs,
              t.atoms.text_contrast_medium,
              {textTransform: 'uppercase', letterSpacing: 0.5},
            ]}>
            <Trans>Actions</Trans>
          </Text>
          <ShortcutRow keys={['n']} description={_(msg`New post`)} />
          <ShortcutRow keys={['/']} description={_(msg`Focus search`)} />
          <ShortcutRow keys={['.']} description={_(msg`Refresh feed`)} />
          <ShortcutRow
            keys={['?']}
            description={_(msg`Show keyboard shortcuts`)}
          />
        </View>
      </View>

      <View style={[a.mt_lg]}>
        <Button
          label={_(msg`Close`)}
          onPress={() => control.close()}
          color="primary"
          size="large">
          <ButtonText>
            <Trans>Close</Trans>
          </ButtonText>
        </Button>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

export function KeyboardShortcutsDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      webOptions={{alignCenter: true}}>
      <Dialog.Handle />
      <KeyboardShortcutsInner />
    </Dialog.Outer>
  )
}
