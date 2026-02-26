import {useEffect, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAppLock} from '#/state/preferences/app-lock'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Shield_Stroke2_Corner0_Rounded as ShieldIcon} from '#/components/icons/Shield'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'
import {
  addLockStateListener,
  authenticateAsync,
  isAvailable,
} from '../../modules/expo-app-lock'

/**
 * Renders an opaque overlay that requires authentication to dismiss.
 * Only active on native when the user has enabled app lock in settings
 * and the device supports biometric/passcode authentication.
 *
 * Locks on both cold start and background→foreground transitions.
 */
export function AppLockGate({children}: {children: React.ReactNode}) {
  const {_} = useLingui()
  const t = useTheme()
  const {hasSession} = useSession()
  const {enabled, autoLockSeconds} = useAppLock()

  // Start locked if app lock is enabled — covers cold start / force-kill
  const [isLocked, setIsLocked] = useState(
    () => IS_NATIVE && enabled && hasSession && isAvailable(),
  )

  useEffect(() => {
    if (!IS_NATIVE || !enabled || !hasSession || !isAvailable()) return

    const subscription = addLockStateListener(event => {
      if (event.secondsInBackground >= autoLockSeconds) {
        setIsLocked(true)
      }
    })

    return () => subscription.remove()
  }, [enabled, hasSession, autoLockSeconds])

  const handleUnlock = async () => {
    const result = await authenticateAsync(_(msg`Unlock SheerSky`))
    if (result.success) {
      setIsLocked(false)
    }
  }

  return (
    <>
      {children}
      {isLocked && (
        <View
          style={[
            StyleSheet.absoluteFill,
            a.justify_center,
            a.align_center,
            a.gap_lg,
            t.atoms.bg,
            {zIndex: 9999},
          ]}>
          <ShieldIcon size="xl" fill={t.palette.primary_500} />
          <Text style={[a.text_xl, a.font_bold, t.atoms.text]}>
            {_(msg`App Locked`)}
          </Text>
          <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
            {_(msg`Authenticate to continue`)}
          </Text>
          <Button
            label={_(msg`Unlock`)}
            onPress={handleUnlock}
            color="primary"
            size="large">
            <ButtonText>{_(msg`Unlock`)}</ButtonText>
          </Button>
        </View>
      )}
    </>
  )
}
