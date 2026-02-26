/**
 * Web stub — app lock is not applicable for web browsers.
 */
import {type AuthResult, type AuthType, type LockStateEvent} from './types'

interface Subscription {
  remove: () => void
}

export function getSupportedAuthTypes(): AuthType[] {
  return ['none']
}

export function isAvailable(): boolean {
  return false
}

export async function authenticateAsync(_reason: string): Promise<AuthResult> {
  // Web apps don't need app lock — browser handles session security
  return {success: true}
}

export function addLockStateListener(
  _callback: (event: LockStateEvent) => void,
): Subscription {
  return {remove: () => {}}
}
