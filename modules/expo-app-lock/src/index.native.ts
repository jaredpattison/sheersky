import {EventEmitter, requireNativeModule} from 'expo-modules-core'

import {type AuthResult, type AuthType, type LockStateEvent} from './types'

interface Subscription {
  remove: () => void
}

const NativeModule = requireNativeModule('ExpoAppLock')
const emitter = new EventEmitter(NativeModule)

/**
 * Returns the authentication types supported by this device.
 * Possible values: 'biometric', 'passcode', 'none'
 */
export function getSupportedAuthTypes(): AuthType[] {
  return NativeModule.getSupportedAuthTypes()
}

/**
 * Whether the device supports any form of authentication (biometric or passcode).
 */
export function isAvailable(): boolean {
  return NativeModule.isAvailable()
}

/**
 * Prompt the user to authenticate with biometrics or device passcode.
 * @param reason  User-visible explanation (e.g. "Unlock SheerSky")
 * @returns       `{ success: true }` or `{ success: false, error: "..." }`
 */
export async function authenticateAsync(reason: string): Promise<AuthResult> {
  return await NativeModule.authenticateAsync(reason)
}

/**
 * Subscribe to lock state changes. The native module tracks when the app
 * enters background/foreground and emits events with `shouldLock` and
 * the number of seconds spent in the background.
 *
 * @param callback  Called when the app returns from background
 * @returns         Subscription that can be removed with `.remove()`
 */
export function addLockStateListener(
  callback: (event: LockStateEvent) => void,
): Subscription {
  const subscription = emitter.addListener('onLockStateChange', callback)
  return {remove: () => subscription.remove()}
}
