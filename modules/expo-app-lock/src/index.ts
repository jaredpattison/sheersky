/**
 * Default fallback — not supported on this platform.
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
  return {success: false, error: 'Not supported on this platform'}
}

export function addLockStateListener(
  _callback: (event: LockStateEvent) => void,
): Subscription {
  // No-op subscription
  return {remove: () => {}}
}
