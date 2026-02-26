/**
 * Tests for expo-app-lock module
 *
 * Tests the web fallback (pure JS), the module-level API via mocking,
 * and type contracts.
 */

beforeEach(() => {
  jest.clearAllMocks()
})

// ========== Web Fallback Tests ==========

describe('expo-app-lock web fallback', () => {
  const webModule = require('../../modules/expo-app-lock/src/index.web')

  describe('getSupportedAuthTypes', () => {
    it('returns none on web', () => {
      expect(webModule.getSupportedAuthTypes()).toEqual(['none'])
    })

    it('returns an array', () => {
      expect(Array.isArray(webModule.getSupportedAuthTypes())).toBe(true)
    })
  })

  describe('isAvailable', () => {
    it('returns false on web', () => {
      expect(webModule.isAvailable()).toBe(false)
    })
  })

  describe('authenticateAsync', () => {
    it('auto-succeeds on web (no lock needed)', async () => {
      const result = await webModule.authenticateAsync('Test')
      expect(result).toEqual({success: true})
    })

    it('ignores the reason string', async () => {
      const result = await webModule.authenticateAsync('Unlock SheerSky')
      expect(result.success).toBe(true)
    })
  })

  describe('addLockStateListener', () => {
    it('returns a subscription with remove()', () => {
      const callback = jest.fn()
      const subscription = webModule.addLockStateListener(callback)
      expect(subscription).toHaveProperty('remove')
      expect(typeof subscription.remove).toBe('function')
    })

    it('remove() does not throw', () => {
      const subscription = webModule.addLockStateListener(jest.fn())
      expect(() => subscription.remove()).not.toThrow()
    })

    it('callback is never called (web has no lock events)', () => {
      const callback = jest.fn()
      webModule.addLockStateListener(callback)
      // No events emitted on web
      expect(callback).not.toHaveBeenCalled()
    })
  })
})

// ========== Module API Tests (via mock) ==========

describe('expo-app-lock module API', () => {
  const mockImpl = {
    getSupportedAuthTypes: jest.fn().mockReturnValue(['biometric', 'passcode']),
    isAvailable: jest.fn().mockReturnValue(true),
    authenticateAsync: jest.fn().mockResolvedValue({success: true}),
    addLockStateListener: jest.fn().mockReturnValue({remove: jest.fn()}),
  }

  jest.mock('../../modules/expo-app-lock', () => ({
    getSupportedAuthTypes: (...args: any[]) =>
      mockImpl.getSupportedAuthTypes(...args),
    isAvailable: (...args: any[]) => mockImpl.isAvailable(...args),
    authenticateAsync: (...args: any[]) => mockImpl.authenticateAsync(...args),
    addLockStateListener: (...args: any[]) =>
      mockImpl.addLockStateListener(...args),
  }))

  const appLock = require('../../modules/expo-app-lock')

  beforeEach(() => {
    mockImpl.getSupportedAuthTypes
      .mockReset()
      .mockReturnValue(['biometric', 'passcode'])
    mockImpl.isAvailable.mockReset().mockReturnValue(true)
    mockImpl.authenticateAsync.mockReset().mockResolvedValue({success: true})
    mockImpl.addLockStateListener
      .mockReset()
      .mockReturnValue({remove: jest.fn()})
  })

  describe('getSupportedAuthTypes', () => {
    it('returns biometric and passcode when both available', () => {
      expect(appLock.getSupportedAuthTypes()).toEqual(['biometric', 'passcode'])
    })

    it('returns only passcode when biometrics unavailable', () => {
      mockImpl.getSupportedAuthTypes.mockReturnValueOnce(['passcode'])
      expect(appLock.getSupportedAuthTypes()).toEqual(['passcode'])
    })

    it('returns none when no auth available', () => {
      mockImpl.getSupportedAuthTypes.mockReturnValueOnce(['none'])
      expect(appLock.getSupportedAuthTypes()).toEqual(['none'])
    })
  })

  describe('isAvailable', () => {
    it('returns true when device supports authentication', () => {
      expect(appLock.isAvailable()).toBe(true)
    })

    it('returns false when unavailable', () => {
      mockImpl.isAvailable.mockReturnValueOnce(false)
      expect(appLock.isAvailable()).toBe(false)
    })
  })

  describe('authenticateAsync', () => {
    it('resolves with success', async () => {
      const result = await appLock.authenticateAsync('Unlock SheerSky')
      expect(result).toEqual({success: true})
      expect(mockImpl.authenticateAsync).toHaveBeenCalledWith('Unlock SheerSky')
    })

    it('resolves with error on failed auth', async () => {
      mockImpl.authenticateAsync.mockResolvedValueOnce({
        success: false,
        error: 'Authentication failed',
      })
      const result = await appLock.authenticateAsync('Test')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication failed')
    })

    it('resolves with error on user cancellation', async () => {
      mockImpl.authenticateAsync.mockResolvedValueOnce({
        success: false,
        error: 'User cancelled authentication',
      })
      const result = await appLock.authenticateAsync('Test')
      expect(result.success).toBe(false)
      expect(result.error).toBe('User cancelled authentication')
    })

    it('resolves with error on biometry lockout', async () => {
      mockImpl.authenticateAsync.mockResolvedValueOnce({
        success: false,
        error: 'Biometry is locked out',
      })
      const result = await appLock.authenticateAsync('Test')
      expect(result.error).toBe('Biometry is locked out')
    })

    it('passes the reason string', async () => {
      await appLock.authenticateAsync('Verify identity')
      expect(mockImpl.authenticateAsync).toHaveBeenCalledWith('Verify identity')
    })

    it('propagates errors', async () => {
      mockImpl.authenticateAsync.mockRejectedValueOnce(
        new Error('Native crash'),
      )
      await expect(appLock.authenticateAsync('Test')).rejects.toThrow(
        'Native crash',
      )
    })
  })

  describe('addLockStateListener', () => {
    it('returns a subscription', () => {
      const callback = jest.fn()
      const sub = appLock.addLockStateListener(callback)
      expect(sub).toHaveProperty('remove')
      expect(mockImpl.addLockStateListener).toHaveBeenCalledWith(callback)
    })

    it('subscription remove() calls through', () => {
      const mockRemove = jest.fn()
      mockImpl.addLockStateListener.mockReturnValueOnce({remove: mockRemove})
      const sub = appLock.addLockStateListener(jest.fn())
      sub.remove()
      expect(mockRemove).toHaveBeenCalled()
    })
  })
})

// ========== Type Contract Tests ==========

describe('expo-app-lock types', () => {
  const webModule = require('../../modules/expo-app-lock/src/index.web')

  it('AuthResult success shape', async () => {
    const result = await webModule.authenticateAsync('Test')
    expect(result).toHaveProperty('success')
    expect(typeof result.success).toBe('boolean')
  })

  it('AuthType values are valid strings', () => {
    const types = webModule.getSupportedAuthTypes()
    for (const t of types) {
      expect(['biometric', 'passcode', 'none']).toContain(t)
    }
  })

  it('Subscription has remove method', () => {
    const sub = webModule.addLockStateListener(jest.fn())
    expect(typeof sub.remove).toBe('function')
  })
})

// ========== Default Fallback Tests ==========
// Note: The default (index.ts) fallback is tested via the web module tests above,
// since jest-expo/ios resolves index.ts → index.native.ts in this test environment.
// The web fallback has the same behavior as the default: returns 'none', false, etc.
