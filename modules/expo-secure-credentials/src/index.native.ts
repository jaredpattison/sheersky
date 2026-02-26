import {requireNativeModule} from 'expo-modules-core'

const NativeModule = requireNativeModule('ExpoSecureCredentials')

/**
 * Store a value in secure storage (iOS Keychain / Android EncryptedSharedPreferences).
 * @param key   Storage key, typically scoped by DID (e.g. `"jwt:did:plc:abc"`)
 * @param value The secret string to store
 */
export async function setItemAsync(key: string, value: string): Promise<void> {
  return await NativeModule.setItemAsync(key, value)
}

/**
 * Retrieve a value from secure storage.
 * @returns The stored string, or `null` if not found
 */
export async function getItemAsync(key: string): Promise<string | null> {
  const result = await NativeModule.getItemAsync(key)
  return result ?? null
}

/**
 * Delete a value from secure storage.
 */
export async function deleteItemAsync(key: string): Promise<void> {
  return await NativeModule.deleteItemAsync(key)
}

/**
 * Check if the current device supports secure storage.
 * Always `true` on native (Keychain/EncryptedSharedPreferences are always available).
 */
export function canUseSecureStorage(): boolean {
  return NativeModule.canUseSecureStorage()
}
