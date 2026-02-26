import {requireNativeModule} from 'expo-modules-core'

const NativeModule = requireNativeModule('ExpoThumbHash')

/**
 * Decode a ThumbHash to a data URI string (base64-encoded PNG).
 * Runs on a background thread with LRU caching.
 *
 * @param base64Hash  Base64-encoded ThumbHash (~28 bytes)
 * @returns           `data:image/png;base64,...` or `null` if invalid
 */
export async function decodeToDataURIAsync(
  base64Hash: string,
): Promise<string | null> {
  const result = await NativeModule.decodeToDataURIAsync(base64Hash)
  return result ?? null
}

/**
 * Extract approximate dimensions from a ThumbHash without full decoding.
 * This is synchronous and very fast — just reads header bytes.
 */
export function approximateDimensions(base64Hash: string): {
  width: number
  height: number
} {
  return NativeModule.approximateDimensions(base64Hash)
}

/**
 * Clear the decoded image cache.
 */
export function clearCache(): void {
  NativeModule.clearCache()
}
