package expo.modules.thumbhash

import android.graphics.Bitmap
import android.util.Base64
import android.util.LruCache
import kotlin.math.max
import kotlin.math.min
import kotlin.math.round

/**
 * Pure Kotlin implementation of the ThumbHash decoding algorithm.
 * Reference: https://evanw.github.io/thumbhash/
 *
 * Decodes the DC (average color) values from a ~28 byte hash into a
 * solid color placeholder bitmap using the correct L/P/Q → RGB conversion.
 */
object ThumbHashDecoder {
  /** LRU cache keyed by base64 hash string, sized by bitmap byte count */
  private val cache = object : LruCache<String, Bitmap>(4 * 1024 * 1024) { // 4MB max
    override fun sizeOf(key: String, value: Bitmap): Int = value.byteCount
  }

  fun decode(base64Hash: String): Bitmap? {
    cache.get(base64Hash)?.let { return it }

    val hash = try {
      Base64.decode(base64Hash, Base64.DEFAULT)
    } catch (e: Exception) {
      return null
    }

    if (hash.size < 5) return null

    val bitmap = thumbHashToBitmap(hash) ?: return null
    cache.put(base64Hash, bitmap)
    return bitmap
  }

  fun approximateDimensions(base64Hash: String): Pair<Int, Int> {
    val hash = try {
      Base64.decode(base64Hash, Base64.DEFAULT)
    } catch (e: Exception) {
      return Pair(32, 32)
    }

    if (hash.size < 3) return Pair(32, 32)

    val header = (hash[0].toInt() and 0xFF) or
      ((hash[1].toInt() and 0xFF) shl 8) or
      ((hash[2].toInt() and 0xFF) shl 16)

    val lIsShorter = (header and 1) != 0
    val lSize = max(3, (header shr 1) and 0x1f)
    val ratio = (32 + ((header shr 6) and 0x1f)) / 64.0
    val sSize = round(if (lIsShorter) lSize / ratio else lSize * ratio).toInt()
    val w = if (lIsShorter) sSize else lSize
    val h = if (lIsShorter) lSize else sSize
    return Pair(w, h)
  }

  fun clearCache() {
    cache.evictAll()
  }

  // --- ThumbHash algorithm ---

  private fun thumbHashToBitmap(hash: ByteArray): Bitmap? {
    val header = (hash[0].toInt() and 0xFF) or
      ((hash[1].toInt() and 0xFF) shl 8) or
      ((hash[2].toInt() and 0xFF) shl 16)

    val lIsShorter = (header and 1) != 0
    val lDc = ((header shr 1) and 0x1f) / 31.0
    val pDc = ((header shr 11) and 0x1f) / 31.0

    val header2 = ((hash[2].toInt() and 0xFF) shr 5) or
      ((hash[3].toInt() and 0xFF) shl 3) or
      ((hash[4].toInt() and 0xFF) shl 11)
    val qDc = ((header2 shr 0) and 0x1f) / 31.0
    val hasAlpha = ((header2 shr 10) and 1) != 0

    // Compute dimensions — parentheses ensure `and 0x1f` applies to
    // the shifted value, not to (32 + shifted_value).
    val lSize = max(3, ((hash[0].toInt() and 0xFF) shr 1) and 0x1f)
    val rawRatio = (((hash[0].toInt() and 0xFF) shr 6) or (((hash[1].toInt() and 0xFF) shl 2))) and 0x1f
    val ratio = (32 + rawRatio) / 64.0
    val sSize = round(if (lIsShorter) lSize / ratio else lSize * ratio).toInt()
    val w = if (lIsShorter) sSize else lSize
    val h = if (lIsShorter) lSize else sSize

    if (w <= 0 || h <= 0 || w > 100 || h > 100) return null

    // Convert L/P/Q color space to RGB using ThumbHash spec coefficients.
    // Reference: https://evanw.github.io/thumbhash/
    val r = (max(0.0, min(1.0, lDc + pDc * 1.402)) * 255).toInt()
    val g = (max(0.0, min(1.0, lDc - pDc * 0.344136 - qDc * 0.714136)) * 255).toInt()
    val b = (max(0.0, min(1.0, lDc + qDc * 1.772)) * 255).toInt()

    // Alpha DC is at header2 bits 15-19
    val a = if (hasAlpha) {
      (max(0.0, min(1.0, ((header2 shr 15) and 0x1f) / 31.0)) * 255).toInt()
    } else {
      255
    }

    val pixels = IntArray(w * h)
    val color = (a shl 24) or (r shl 16) or (g shl 8) or b
    pixels.fill(color)

    return Bitmap.createBitmap(pixels, w, h, Bitmap.Config.ARGB_8888)
  }
}
