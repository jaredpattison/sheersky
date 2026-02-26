/**
 * Tests for expo-secure-credentials module
 *
 * Tests the web fallback implementation (pure JS) and the integration
 * utilities that wrap the native bridge. The native bridge is tested
 * indirectly through the integration utilities with mocked native calls.
 */

beforeEach(() => {
  jest.clearAllMocks()
})

// ========== Web Fallback Tests ==========

describe('expo-secure-credentials web fallback', () => {
  const webModule = require('../../modules/expo-secure-credentials/src/index.web')

  let mockStorage: Map<string, string>

  beforeEach(() => {
    mockStorage = new Map()
    Object.defineProperty(global, 'sessionStorage', {
      value: {
        getItem: (key: string) => mockStorage.get(key) ?? null,
        setItem: (key: string, value: string) => mockStorage.set(key, value),
        removeItem: (key: string) => mockStorage.delete(key),
      },
      writable: true,
      configurable: true,
    })
  })

  describe('canUseSecureStorage', () => {
    it('returns false on web', () => {
      expect(webModule.canUseSecureStorage()).toBe(false)
    })
  })

  describe('setItemAsync + getItemAsync roundtrip', () => {
    it('stores and retrieves values via sessionStorage', async () => {
      await webModule.setItemAsync('key1', 'value1')
      const result = await webModule.getItemAsync('key1')
      expect(result).toBe('value1')
    })

    it('handles empty string values', async () => {
      await webModule.setItemAsync('empty', '')
      const result = await webModule.getItemAsync('empty')
      expect(result).toBe('')
    })

    it('handles long values (JWTs)', async () => {
      const longJwt = 'eyJ' + 'a'.repeat(500) + '.payload.signature'
      await webModule.setItemAsync('jwt', longJwt)
      const result = await webModule.getItemAsync('jwt')
      expect(result).toBe(longJwt)
    })

    it('overwrites existing values', async () => {
      await webModule.setItemAsync('key', 'old')
      await webModule.setItemAsync('key', 'new')
      const result = await webModule.getItemAsync('key')
      expect(result).toBe('new')
    })
  })

  describe('getItemAsync', () => {
    it('returns null for missing keys', async () => {
      const result = await webModule.getItemAsync('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('deleteItemAsync', () => {
    it('deletes values', async () => {
      await webModule.setItemAsync('key1', 'value1')
      await webModule.deleteItemAsync('key1')
      const result = await webModule.getItemAsync('key1')
      expect(result).toBeNull()
    })

    it('does not throw for nonexistent keys', async () => {
      await expect(
        webModule.deleteItemAsync('nonexistent'),
      ).resolves.toBeUndefined()
    })
  })

  describe('key prefixing', () => {
    it('uses prefixed keys to avoid collisions', async () => {
      await webModule.setItemAsync('test', 'data')
      expect(mockStorage.get('__secure_credentials:test')).toBe('data')
    })

    it('different keys are stored separately', async () => {
      await webModule.setItemAsync('a', '1')
      await webModule.setItemAsync('b', '2')
      expect(mockStorage.get('__secure_credentials:a')).toBe('1')
      expect(mockStorage.get('__secure_credentials:b')).toBe('2')
    })
  })
})

// ========== Integration Utility Tests ==========

describe('secure-credentials integration utilities', () => {
  // Mock the module that the integration utilities import
  jest.mock('../../modules/expo-secure-credentials', () => ({
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    getItemAsync: jest.fn().mockResolvedValue(null),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
    canUseSecureStorage: jest.fn().mockReturnValue(true),
  }))

  const mockModule = require('../../modules/expo-secure-credentials')

  const {
    saveTokens,
    getTokens,
    clearTokens,
    clearAllTokens,
    canUseSecureStorage,
  } = require('../../src/lib/secure-credentials')

  const testDid = 'did:plc:test123'
  const testAccessJwt = 'eyJhbGciOiJFUzI1NiJ9.access.sig'
  const testRefreshJwt = 'eyJhbGciOiJFUzI1NiJ9.refresh.sig'

  beforeEach(() => {
    jest.clearAllMocks()
    mockModule.getItemAsync.mockResolvedValue(null)
  })

  describe('canUseSecureStorage', () => {
    it('delegates to module', () => {
      expect(canUseSecureStorage()).toBe(true)
      expect(mockModule.canUseSecureStorage).toHaveBeenCalled()
    })
  })

  describe('saveTokens', () => {
    it('stores both JWTs keyed by DID', async () => {
      await saveTokens(testDid, testAccessJwt, testRefreshJwt)

      expect(mockModule.setItemAsync).toHaveBeenCalledTimes(2)
      expect(mockModule.setItemAsync).toHaveBeenCalledWith(
        `accessJwt:${testDid}`,
        testAccessJwt,
      )
      expect(mockModule.setItemAsync).toHaveBeenCalledWith(
        `refreshJwt:${testDid}`,
        testRefreshJwt,
      )
    })

    it('saves tokens concurrently (both called immediately)', async () => {
      let resolveAccess!: () => void
      let resolveRefresh!: () => void
      const accessPromise = new Promise<void>(r => {
        resolveAccess = r
      })
      const refreshPromise = new Promise<void>(r => {
        resolveRefresh = r
      })

      mockModule.setItemAsync
        .mockReturnValueOnce(accessPromise)
        .mockReturnValueOnce(refreshPromise)

      const savePromise = saveTokens(testDid, testAccessJwt, testRefreshJwt)

      // Both should have been called immediately (parallel via Promise.all)
      expect(mockModule.setItemAsync).toHaveBeenCalledTimes(2)

      resolveAccess()
      resolveRefresh()
      await savePromise
    })
  })

  describe('getTokens', () => {
    it('retrieves both JWTs for a DID', async () => {
      mockModule.getItemAsync
        .mockResolvedValueOnce(testAccessJwt)
        .mockResolvedValueOnce(testRefreshJwt)

      const tokens = await getTokens(testDid)

      expect(tokens).toEqual({
        accessJwt: testAccessJwt,
        refreshJwt: testRefreshJwt,
      })
      expect(mockModule.getItemAsync).toHaveBeenCalledWith(
        `accessJwt:${testDid}`,
      )
      expect(mockModule.getItemAsync).toHaveBeenCalledWith(
        `refreshJwt:${testDid}`,
      )
    })

    it('returns null for missing tokens (expired session)', async () => {
      mockModule.getItemAsync
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)

      const tokens = await getTokens(testDid)
      expect(tokens).toEqual({accessJwt: null, refreshJwt: null})
    })

    it('handles partial token availability', async () => {
      mockModule.getItemAsync
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(testRefreshJwt)

      const tokens = await getTokens(testDid)
      expect(tokens).toEqual({accessJwt: null, refreshJwt: testRefreshJwt})
    })
  })

  describe('clearTokens', () => {
    it('deletes both JWTs for a DID', async () => {
      await clearTokens(testDid)

      expect(mockModule.deleteItemAsync).toHaveBeenCalledTimes(2)
      expect(mockModule.deleteItemAsync).toHaveBeenCalledWith(
        `accessJwt:${testDid}`,
      )
      expect(mockModule.deleteItemAsync).toHaveBeenCalledWith(
        `refreshJwt:${testDid}`,
      )
    })
  })

  describe('clearAllTokens', () => {
    it('deletes tokens for all DIDs', async () => {
      const dids = ['did:plc:alice', 'did:plc:bob', 'did:plc:carol']
      await clearAllTokens(dids)

      // 2 deletes per DID (access + refresh)
      expect(mockModule.deleteItemAsync).toHaveBeenCalledTimes(6)
    })

    it('handles empty DID list', async () => {
      await clearAllTokens([])
      expect(mockModule.deleteItemAsync).not.toHaveBeenCalled()
    })

    it('handles single DID', async () => {
      await clearAllTokens([testDid])
      expect(mockModule.deleteItemAsync).toHaveBeenCalledTimes(2)
    })
  })

  describe('key scoping', () => {
    it('different DIDs produce different keys', async () => {
      await saveTokens('did:plc:alice', 'jwt-a', 'jwt-ar')
      await saveTokens('did:plc:bob', 'jwt-b', 'jwt-br')

      expect(mockModule.setItemAsync).toHaveBeenCalledWith(
        'accessJwt:did:plc:alice',
        'jwt-a',
      )
      expect(mockModule.setItemAsync).toHaveBeenCalledWith(
        'accessJwt:did:plc:bob',
        'jwt-b',
      )
    })
  })
})
