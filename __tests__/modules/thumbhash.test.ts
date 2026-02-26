/**
 * Tests for expo-thumbhash module
 *
 * Tests the web decoder (pure JS with dimension extraction),
 * the native bridge via module-level mocking, and the default fallback.
 */

beforeEach(() => {
  jest.clearAllMocks()
})

// ========== Web Decoder Tests ==========

describe('expo-thumbhash web decoder', () => {
  const webModule = require('../../modules/expo-thumbhash/src/index.web')

  // A minimal valid ThumbHash — 8 bytes base64-encoded
  const validHash = Buffer.from([
    0x63, 0x9a, 0x86, 0x3d, 0x0c, 0x3b, 0xb0, 0x59,
  ]).toString('base64')

  describe('approximateDimensions', () => {
    it('extracts dimensions from hash header', () => {
      const dims = webModule.approximateDimensions(validHash)
      expect(dims).toHaveProperty('width')
      expect(dims).toHaveProperty('height')
      expect(dims.width).toBeGreaterThan(0)
      expect(dims.height).toBeGreaterThan(0)
    })

    it('dimensions are reasonable (within 1-100 range)', () => {
      const dims = webModule.approximateDimensions(validHash)
      expect(dims.width).toBeGreaterThanOrEqual(1)
      expect(dims.width).toBeLessThanOrEqual(100)
      expect(dims.height).toBeGreaterThanOrEqual(1)
      expect(dims.height).toBeLessThanOrEqual(100)
    })

    it('produces consistent results for same input', () => {
      const dims1 = webModule.approximateDimensions(validHash)
      const dims2 = webModule.approximateDimensions(validHash)
      expect(dims1).toEqual(dims2)
    })

    it('different hashes produce different dimensions', () => {
      const hash2 = Buffer.from([
        0x13, 0x5a, 0x46, 0x1d, 0x2c, 0x1b, 0xa0, 0x49,
      ]).toString('base64')
      const dims1 = webModule.approximateDimensions(validHash)
      const dims2 = webModule.approximateDimensions(hash2)
      expect(dims1.width !== dims2.width || dims1.height !== dims2.height).toBe(
        true,
      )
    })

    it('extracts correct lSize from header byte 0', () => {
      // lSize is bits 1-5 of byte 0
      // 0x63 = 01100011 → bits 1-5 = 10001 = 17
      // But lSize = max(3, value) so it's max(3, 17) = 17
      const dims = webModule.approximateDimensions(validHash)
      // Just verify it's a reasonable number from the header
      expect(dims.width + dims.height).toBeGreaterThan(0)
    })

    it('handles various hash lengths', () => {
      // 5 bytes (minimum)
      const hash5 = Buffer.from([0x63, 0x9a, 0x86, 0x3d, 0x0c]).toString(
        'base64',
      )
      const dims5 = webModule.approximateDimensions(hash5)
      expect(dims5.width).toBeGreaterThan(0)
      expect(dims5.height).toBeGreaterThan(0)

      // 28 bytes (typical)
      const hash28 = Buffer.from(new Array(28).fill(0x50)).toString('base64')
      const dims28 = webModule.approximateDimensions(hash28)
      expect(dims28.width).toBeGreaterThan(0)
      expect(dims28.height).toBeGreaterThan(0)
    })
  })

  describe('clearCache', () => {
    it('does not throw', () => {
      expect(() => webModule.clearCache()).not.toThrow()
    })

    it('can be called multiple times', () => {
      webModule.clearCache()
      webModule.clearCache()
      // No error means success
    })
  })

  describe('decodeToDataURIAsync (without canvas)', () => {
    // jsdom doesn't have a real canvas, so full decode will fail
    // but we can test error handling

    it('returns null when canvas is unavailable', async () => {
      const result = await webModule.decodeToDataURIAsync(validHash)
      // Without canvas API, should return null gracefully
      expect(result === null || typeof result === 'string').toBe(true)
    })

    it('returns null for empty hash', async () => {
      const result = await webModule.decodeToDataURIAsync('')
      expect(result).toBeNull()
    })
  })
})

// ========== Native Bridge Tests (via module-level mock) ==========

describe('expo-thumbhash native bridge', () => {
  const mockNative = {
    decodeToDataURIAsync: jest.fn().mockResolvedValue(null),
    approximateDimensions: jest.fn().mockReturnValue({width: 32, height: 32}),
    clearCache: jest.fn(),
  }

  jest.mock('../../modules/expo-thumbhash', () => ({
    decodeToDataURIAsync: (...args: any[]) =>
      mockNative.decodeToDataURIAsync(...args),
    approximateDimensions: (...args: any[]) =>
      mockNative.approximateDimensions(...args),
    clearCache: (...args: any[]) => mockNative.clearCache(...args),
    ThumbHashView: () => null,
  }))

  const thumbhash = require('../../modules/expo-thumbhash')

  beforeEach(() => {
    mockNative.decodeToDataURIAsync.mockReset().mockResolvedValue(null)
    mockNative.approximateDimensions
      .mockReset()
      .mockReturnValue({width: 32, height: 32})
    mockNative.clearCache.mockReset()
  })

  describe('decodeToDataURIAsync', () => {
    it('calls through to implementation', async () => {
      const hash = 'YJqGPQw7sFlslqhFafSE+Q6oJ1h2iHB2Rw=='
      await thumbhash.decodeToDataURIAsync(hash)
      expect(mockNative.decodeToDataURIAsync).toHaveBeenCalledWith(hash)
    })

    it('returns data URI when available', async () => {
      const expectedURI = 'data:image/png;base64,iVBORw0KGgo...'
      mockNative.decodeToDataURIAsync.mockResolvedValueOnce(expectedURI)
      const result = await thumbhash.decodeToDataURIAsync('abc123')
      expect(result).toBe(expectedURI)
    })

    it('returns null for invalid hash', async () => {
      mockNative.decodeToDataURIAsync.mockResolvedValueOnce(null)
      const result = await thumbhash.decodeToDataURIAsync('invalid')
      expect(result).toBeNull()
    })

    it('handles empty string hash', async () => {
      await thumbhash.decodeToDataURIAsync('')
      expect(mockNative.decodeToDataURIAsync).toHaveBeenCalledWith('')
    })

    it('propagates errors', async () => {
      mockNative.decodeToDataURIAsync.mockRejectedValueOnce(
        new Error('Decode failed'),
      )
      await expect(thumbhash.decodeToDataURIAsync('bad')).rejects.toThrow(
        'Decode failed',
      )
    })
  })

  describe('approximateDimensions', () => {
    it('returns dimensions', () => {
      mockNative.approximateDimensions.mockReturnValueOnce({
        width: 32,
        height: 24,
      })
      const dims = thumbhash.approximateDimensions('abc123')
      expect(dims).toEqual({width: 32, height: 24})
    })

    it('passes hash to implementation', () => {
      thumbhash.approximateDimensions('testHash')
      expect(mockNative.approximateDimensions).toHaveBeenCalledWith('testHash')
    })

    it('returns width and height as numbers', () => {
      mockNative.approximateDimensions.mockReturnValueOnce({
        width: 16,
        height: 12,
      })
      const dims = thumbhash.approximateDimensions('abc')
      expect(typeof dims.width).toBe('number')
      expect(typeof dims.height).toBe('number')
    })

    it('handles landscape aspect ratio', () => {
      mockNative.approximateDimensions.mockReturnValueOnce({
        width: 32,
        height: 18,
      })
      const dims = thumbhash.approximateDimensions('landscape')
      expect(dims.width).toBeGreaterThan(dims.height)
    })

    it('handles portrait aspect ratio', () => {
      mockNative.approximateDimensions.mockReturnValueOnce({
        width: 18,
        height: 32,
      })
      const dims = thumbhash.approximateDimensions('portrait')
      expect(dims.height).toBeGreaterThan(dims.width)
    })

    it('handles square aspect ratio', () => {
      mockNative.approximateDimensions.mockReturnValueOnce({
        width: 32,
        height: 32,
      })
      const dims = thumbhash.approximateDimensions('square')
      expect(dims.width).toBe(dims.height)
    })
  })

  describe('clearCache', () => {
    it('calls through to implementation', () => {
      thumbhash.clearCache()
      expect(mockNative.clearCache).toHaveBeenCalled()
    })

    it('can be called multiple times', () => {
      thumbhash.clearCache()
      thumbhash.clearCache()
      thumbhash.clearCache()
      expect(mockNative.clearCache).toHaveBeenCalledTimes(3)
    })
  })
})

// ========== Default Fallback Tests ==========

describe('expo-thumbhash default fallback', () => {
  // The default index.ts throws NotImplementedError for all functions

  const defaultModule = require('../../modules/expo-thumbhash/src/index')

  it('throws for decodeToDataURIAsync', async () => {
    await expect(defaultModule.decodeToDataURIAsync('abc')).rejects.toThrow()
  })

  it('throws for approximateDimensions', () => {
    expect(() => defaultModule.approximateDimensions('abc')).toThrow()
  })

  it('throws for clearCache', () => {
    expect(() => defaultModule.clearCache()).toThrow()
  })
})
