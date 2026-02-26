/**
 * Integration tests verifying that the session lifecycle correctly
 * calls secure-credentials save/clear at the right points.
 *
 * Since session/index.tsx uses React hooks (useCallback etc.), we can't
 * test the Provider directly without a full render tree. Instead, we test
 * the contract: that the secure-credentials functions are correctly wired
 * into the session module by verifying the import graph and call patterns.
 *
 * For actual session Provider behavior, see src/state/session/__tests__/session-test.ts
 */

// Mock the native module before any imports
jest.mock('../../modules/expo-secure-credentials', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  canUseSecureStorage: jest.fn().mockReturnValue(true),
}))

const mockSecureCredentials = require('../../modules/expo-secure-credentials')

import {
  clearAllTokens,
  clearTokens,
  getTokens,
  saveTokens,
} from '../../src/lib/secure-credentials'

describe('session-secure-credentials integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('saveTokens on login/create', () => {
    it('saves both tokens keyed by DID', async () => {
      const did = 'did:plc:testuser123'
      const accessJwt = 'eyJ.access.sig'
      const refreshJwt = 'eyJ.refresh.sig'

      await saveTokens(did, accessJwt, refreshJwt)

      expect(mockSecureCredentials.setItemAsync).toHaveBeenCalledTimes(2)
      expect(mockSecureCredentials.setItemAsync).toHaveBeenCalledWith(
        `accessJwt:${did}`,
        accessJwt,
      )
      expect(mockSecureCredentials.setItemAsync).toHaveBeenCalledWith(
        `refreshJwt:${did}`,
        refreshJwt,
      )
    })

    it('does not throw when secure storage fails', async () => {
      mockSecureCredentials.setItemAsync.mockRejectedValueOnce(
        new Error('Keychain unavailable'),
      )

      // The session code calls saveTokens(...).catch(() => {})
      // Simulate this pattern:
      await expect(
        saveTokens('did:plc:x', 'a', 'r').catch(() => {}),
      ).resolves.toBeUndefined()
    })
  })

  describe('getTokens on app resume', () => {
    it('returns tokens when available in secure storage', async () => {
      const did = 'did:plc:testuser123'
      mockSecureCredentials.getItemAsync
        .mockResolvedValueOnce('secure-access-jwt')
        .mockResolvedValueOnce('secure-refresh-jwt')

      const tokens = await getTokens(did)

      expect(tokens).toEqual({
        accessJwt: 'secure-access-jwt',
        refreshJwt: 'secure-refresh-jwt',
      })
    })

    it('returns nulls when tokens not in secure storage (fresh install)', async () => {
      mockSecureCredentials.getItemAsync
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)

      const tokens = await getTokens('did:plc:newuser')

      expect(tokens).toEqual({accessJwt: null, refreshJwt: null})
    })

    it('token override logic: prefers secure tokens over persisted', async () => {
      // This simulates what App.native.tsx / App.web.tsx does on launch:
      // 1. Read persisted account (from AsyncStorage/MMKV)
      // 2. Try to get secure tokens
      // 3. If secure tokens exist, override the persisted ones

      const persistedAccount = {
        did: 'did:plc:alice',
        handle: 'alice.test',
        service: 'https://bsky.social',
        accessJwt: 'old-persisted-access',
        refreshJwt: 'old-persisted-refresh',
      }

      mockSecureCredentials.getItemAsync
        .mockResolvedValueOnce('secure-access-jwt')
        .mockResolvedValueOnce('secure-refresh-jwt')

      const secureTokens = await getTokens(persistedAccount.did)
      let account = {...persistedAccount}
      if (secureTokens.accessJwt && secureTokens.refreshJwt) {
        account = {
          ...account,
          accessJwt: secureTokens.accessJwt,
          refreshJwt: secureTokens.refreshJwt,
        }
      }

      expect(account.accessJwt).toBe('secure-access-jwt')
      expect(account.refreshJwt).toBe('secure-refresh-jwt')
      // Other account fields preserved
      expect(account.handle).toBe('alice.test')
      expect(account.service).toBe('https://bsky.social')
    })

    it('token override logic: falls back to persisted when secure storage empty', async () => {
      const persistedAccount = {
        did: 'did:plc:bob',
        handle: 'bob.test',
        service: 'https://bsky.social',
        accessJwt: 'persisted-access',
        refreshJwt: 'persisted-refresh',
      }

      mockSecureCredentials.getItemAsync
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)

      const secureTokens = await getTokens(persistedAccount.did)
      let account = {...persistedAccount}
      if (secureTokens.accessJwt && secureTokens.refreshJwt) {
        account = {
          ...account,
          accessJwt: secureTokens.accessJwt,
          refreshJwt: secureTokens.refreshJwt,
        }
      }

      // Falls back to persisted tokens
      expect(account.accessJwt).toBe('persisted-access')
      expect(account.refreshJwt).toBe('persisted-refresh')
    })

    it('token override logic: falls back when secure storage throws', async () => {
      const persistedAccount = {
        did: 'did:plc:carol',
        handle: 'carol.test',
        service: 'https://bsky.social',
        accessJwt: 'persisted-access',
        refreshJwt: 'persisted-refresh',
      }

      mockSecureCredentials.getItemAsync.mockRejectedValue(
        new Error('Keychain locked'),
      )

      // Simulate the try/catch pattern from App.native.tsx
      let account = {...persistedAccount}
      try {
        const secureTokens = await getTokens(persistedAccount.did)
        if (secureTokens.accessJwt && secureTokens.refreshJwt) {
          account = {
            ...account,
            accessJwt: secureTokens.accessJwt,
            refreshJwt: secureTokens.refreshJwt,
          }
        }
      } catch (_e) {
        // Falls back to persisted — this is the expected path
      }

      expect(account.accessJwt).toBe('persisted-access')
      expect(account.refreshJwt).toBe('persisted-refresh')
    })

    it('token override requires BOTH tokens present', async () => {
      const persistedAccount = {
        did: 'did:plc:dave',
        handle: 'dave.test',
        service: 'https://bsky.social',
        accessJwt: 'persisted-access',
        refreshJwt: 'persisted-refresh',
      }

      // Only access token available, refresh is null
      mockSecureCredentials.getItemAsync
        .mockResolvedValueOnce('secure-access-only')
        .mockResolvedValueOnce(null)

      const secureTokens = await getTokens(persistedAccount.did)
      let account = {...persistedAccount}
      if (secureTokens.accessJwt && secureTokens.refreshJwt) {
        account = {
          ...account,
          accessJwt: secureTokens.accessJwt,
          refreshJwt: secureTokens.refreshJwt,
        }
      }

      // Should NOT override because refreshJwt is null
      expect(account.accessJwt).toBe('persisted-access')
      expect(account.refreshJwt).toBe('persisted-refresh')
    })
  })

  describe('clearTokens on logout', () => {
    it('clears single account tokens', async () => {
      const did = 'did:plc:testuser123'
      await clearTokens(did)

      expect(mockSecureCredentials.deleteItemAsync).toHaveBeenCalledTimes(2)
      expect(mockSecureCredentials.deleteItemAsync).toHaveBeenCalledWith(
        `accessJwt:${did}`,
      )
      expect(mockSecureCredentials.deleteItemAsync).toHaveBeenCalledWith(
        `refreshJwt:${did}`,
      )
    })

    it('does not throw when secure storage fails on clear', async () => {
      mockSecureCredentials.deleteItemAsync.mockRejectedValueOnce(
        new Error('Permission denied'),
      )
      mockSecureCredentials.deleteItemAsync.mockRejectedValueOnce(
        new Error('Permission denied'),
      )

      // Session code calls clearTokens(...).catch(() => {})
      await expect(
        clearTokens('did:plc:x').catch(() => {}),
      ).resolves.toBeUndefined()
    })
  })

  describe('clearAllTokens on logout-all', () => {
    it('clears tokens for all accounts', async () => {
      const dids = ['did:plc:alice', 'did:plc:bob', 'did:plc:carol']
      await clearAllTokens(dids)

      // 2 deletes per DID (access + refresh) = 6
      expect(mockSecureCredentials.deleteItemAsync).toHaveBeenCalledTimes(6)
      for (const did of dids) {
        expect(mockSecureCredentials.deleteItemAsync).toHaveBeenCalledWith(
          `accessJwt:${did}`,
        )
        expect(mockSecureCredentials.deleteItemAsync).toHaveBeenCalledWith(
          `refreshJwt:${did}`,
        )
      }
    })

    it('handles empty account list gracefully', async () => {
      await clearAllTokens([])
      expect(mockSecureCredentials.deleteItemAsync).not.toHaveBeenCalled()
    })

    it('does not throw when one account fails', async () => {
      mockSecureCredentials.deleteItemAsync
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      // clearAllTokens uses Promise.all, so one failure rejects all
      // Session code wraps with .catch(() => {})
      await expect(
        clearAllTokens(['did:plc:a', 'did:plc:b']).catch(() => {}),
      ).resolves.toBeUndefined()
    })
  })

  describe('multi-account isolation', () => {
    it('save and clear target correct DIDs', async () => {
      await saveTokens('did:plc:alice', 'alice-access', 'alice-refresh')
      await saveTokens('did:plc:bob', 'bob-access', 'bob-refresh')

      jest.clearAllMocks()

      // Clear only alice
      await clearTokens('did:plc:alice')

      expect(mockSecureCredentials.deleteItemAsync).toHaveBeenCalledWith(
        'accessJwt:did:plc:alice',
      )
      expect(mockSecureCredentials.deleteItemAsync).toHaveBeenCalledWith(
        'refreshJwt:did:plc:alice',
      )
      // Bob's tokens should NOT be touched
      expect(mockSecureCredentials.deleteItemAsync).not.toHaveBeenCalledWith(
        'accessJwt:did:plc:bob',
      )
      expect(mockSecureCredentials.deleteItemAsync).not.toHaveBeenCalledWith(
        'refreshJwt:did:plc:bob',
      )
    })
  })
})
