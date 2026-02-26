/**
 * Web fallback: uses sessionStorage so tokens are cleared when the tab closes.
 * This is a deliberate security trade-off — web has no equivalent to Keychain
 * or EncryptedSharedPreferences, and sessionStorage limits exposure to the
 * current browsing session.
 */

const PREFIX = '__secure_credentials:'

export async function setItemAsync(key: string, value: string): Promise<void> {
  try {
    sessionStorage.setItem(PREFIX + key, value)
  } catch (e) {
    console.warn('expo-secure-credentials: sessionStorage write failed', e)
  }
}

export async function getItemAsync(key: string): Promise<string | null> {
  try {
    return sessionStorage.getItem(PREFIX + key)
  } catch {
    return null
  }
}

export async function deleteItemAsync(key: string): Promise<void> {
  try {
    sessionStorage.removeItem(PREFIX + key)
  } catch {
    // noop
  }
}

export function canUseSecureStorage(): boolean {
  return false
}
