export type AuthType = 'biometric' | 'passcode' | 'none'

export interface AuthResult {
  success: boolean
  error?: string
}

export interface LockStateEvent {
  /** How many seconds the app was in the background */
  secondsInBackground: number
}
