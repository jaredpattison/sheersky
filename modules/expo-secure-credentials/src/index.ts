/**
 * Default fallback — throws on unsupported platforms.
 */

class NotSupportedError extends Error {
  constructor(method: string) {
    super(
      `expo-secure-credentials: ${method} is not supported on this platform`,
    )
    this.name = 'NotSupportedError'
  }
}

export async function setItemAsync(
  _key: string,
  _value: string,
): Promise<void> {
  throw new NotSupportedError('setItemAsync')
}

export async function getItemAsync(_key: string): Promise<string | null> {
  throw new NotSupportedError('getItemAsync')
}

export async function deleteItemAsync(_key: string): Promise<void> {
  throw new NotSupportedError('deleteItemAsync')
}

export function canUseSecureStorage(): boolean {
  return false
}
