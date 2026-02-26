/**
 * Default fallback — not supported on this platform.
 */

class NotSupportedError extends Error {
  constructor(method: string) {
    super(`expo-thumbhash: ${method} is not supported on this platform`)
    this.name = 'NotSupportedError'
  }
}

export async function decodeToDataURIAsync(
  _base64Hash: string,
): Promise<string | null> {
  throw new NotSupportedError('decodeToDataURIAsync')
}

export function approximateDimensions(_base64Hash: string): {
  width: number
  height: number
} {
  throw new NotSupportedError('approximateDimensions')
}

export function clearCache(): void {
  throw new NotSupportedError('clearCache')
}
