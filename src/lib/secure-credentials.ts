/**
 * Secure credential storage utilities.
 *
 * On native, tokens are stored in iOS Keychain / Android EncryptedSharedPreferences.
 * On web, falls back to sessionStorage (cleared when tab closes).
 *
 * Keys are scoped by DID to support multi-account:
 *   - `accessJwt:<did>`
 *   - `refreshJwt:<did>`
 */
import {
  canUseSecureStorage,
  deleteItemAsync,
  getItemAsync,
  setItemAsync,
} from '../../modules/expo-secure-credentials'

export {canUseSecureStorage}

function accessKey(did: string): string {
  return `accessJwt:${did}`
}

function refreshKey(did: string): string {
  return `refreshJwt:${did}`
}

/**
 * Store both JWTs for an account in secure storage.
 */
export async function saveTokens(
  did: string,
  accessJwt: string,
  refreshJwt: string,
): Promise<void> {
  await Promise.all([
    setItemAsync(accessKey(did), accessJwt),
    setItemAsync(refreshKey(did), refreshJwt),
  ])
}

/**
 * Retrieve stored JWTs for an account.
 * Returns `null` for missing tokens (e.g. expired session).
 */
export async function getTokens(
  did: string,
): Promise<{accessJwt: string | null; refreshJwt: string | null}> {
  const [accessJwt, refreshJwt] = await Promise.all([
    getItemAsync(accessKey(did)),
    getItemAsync(refreshKey(did)),
  ])
  return {accessJwt, refreshJwt}
}

/**
 * Delete stored JWTs for an account (on logout or account removal).
 */
export async function clearTokens(did: string): Promise<void> {
  await Promise.all([
    deleteItemAsync(accessKey(did)),
    deleteItemAsync(refreshKey(did)),
  ])
}

/**
 * Delete tokens for all accounts in the provided list.
 */
export async function clearAllTokens(dids: string[]): Promise<void> {
  await Promise.all(dids.map(did => clearTokens(did)))
}
