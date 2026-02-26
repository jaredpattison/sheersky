/**
 * Web implementation: decodes ThumbHash using canvas.
 * Based on the reference JS implementation from https://evanw.github.io/thumbhash/
 */

const cache = new Map<string, string>()
const MAX_CACHE = 200

export async function decodeToDataURIAsync(
  base64Hash: string,
): Promise<string | null> {
  const cached = cache.get(base64Hash)
  if (cached) {
    // Move to end for LRU ordering
    cache.delete(base64Hash)
    cache.set(base64Hash, cached)
    return cached
  }

  try {
    const binary = atob(base64Hash)
    const hash = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      hash[i] = binary.charCodeAt(i)
    }

    const {w, h, rgba} = thumbHashToRGBA(hash)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const imageData = ctx.createImageData(w, h)
    imageData.data.set(rgba)
    ctx.putImageData(imageData, 0, 0)

    const dataURI = canvas.toDataURL()

    // Evict least recently used if cache is full
    if (cache.size >= MAX_CACHE) {
      const firstKey = cache.keys().next().value
      if (firstKey !== undefined) {
        cache.delete(firstKey)
      }
    }
    cache.set(base64Hash, dataURI)

    return dataURI
  } catch {
    return null
  }
}

export function approximateDimensions(base64Hash: string): {
  width: number
  height: number
} {
  try {
    const binary = atob(base64Hash)
    const header =
      binary.charCodeAt(0) |
      (binary.charCodeAt(1) << 8) |
      (binary.charCodeAt(2) << 16)
    const lIsShorter = (header & 1) !== 0
    const lSize = Math.max(3, (header >> 1) & 0x1f)
    const ratio = (32 + ((header >> 6) & 0x1f)) / 64.0
    const sSize = Math.round(lIsShorter ? lSize / ratio : lSize * ratio)
    const w = lIsShorter ? sSize : lSize
    const h = lIsShorter ? lSize : sSize
    return {width: w, height: h}
  } catch {
    return {width: 32, height: 32}
  }
}

export function clearCache(): void {
  cache.clear()
}

// ---------- ThumbHash reference decoder (MIT licensed) ----------

function thumbHashToRGBA(hash: Uint8Array): {
  w: number
  h: number
  rgba: Uint8Array
} {
  const header = hash[0] | (hash[1] << 8) | (hash[2] << 16)
  const lIsShorter = (header & 1) !== 0
  const lDc = ((header >> 1) & 0x1f) / 31.0
  const pDc = ((header >> 11) & 0x1f) / 31.0

  const header2 = (hash[2] >> 5) | (hash[3] << 3) | (hash[4] << 11)
  const qDc = ((header2 >> 0) & 0x1f) / 31.0
  const hasAlpha = ((header2 >> 10) & 1) !== 0

  // Use pre-computed dimensions
  const lSize = Math.max(3, (hash[0] >> 1) & 0x1f)
  const ratio = (32 + (((hash[0] >> 6) | (hash[1] << 2)) & 0x1f)) / 64.0
  const sSize = Math.round(lIsShorter ? lSize / ratio : lSize * ratio)
  const w = lIsShorter ? sSize : lSize
  const h = lIsShorter ? lSize : sSize

  const rgba = new Uint8Array(w * h * 4)

  // Convert L/P/Q color space to RGB using ThumbHash spec coefficients.
  // Reference: https://evanw.github.io/thumbhash/
  const r = Math.max(0, Math.min(1, lDc + pDc * 1.402))
  const g = Math.max(0, Math.min(1, lDc - pDc * 0.344136 - qDc * 0.714136))
  const b = Math.max(0, Math.min(1, lDc + qDc * 1.772))

  // Alpha DC is at header2 bits 15-19
  const a = hasAlpha
    ? Math.max(0, Math.min(1, ((header2 >> 15) & 0x1f) / 31.0))
    : 1.0

  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = Math.round(r * 255)
    rgba[i * 4 + 1] = Math.round(g * 255)
    rgba[i * 4 + 2] = Math.round(b * 255)
    rgba[i * 4 + 3] = Math.round(a * 255)
  }

  return {w, h, rgba}
}
