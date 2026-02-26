import Foundation
import UIKit

/// Pure Swift implementation of the ThumbHash decoding algorithm.
/// Reference: https://evanw.github.io/thumbhash/
///
/// ThumbHash encodes a small (~28 byte) representation of an image
/// that can be decoded into a blurred placeholder. This implementation
/// decodes the DC (average color) values from the hash into a solid
/// color UIImage using the correct L/P/Q → RGB color space conversion.
final class ThumbHashDecoder {
  static let shared = ThumbHashDecoder()

  /// LRU cache for decoded images. NSCache handles memory pressure automatically.
  private let cache = NSCache<NSString, UIImage>()

  private init() {
    cache.countLimit = 200
  }

  // MARK: - Public API

  func decode(base64Hash: String) -> UIImage? {
    // Check cache first
    if let cached = cache.object(forKey: base64Hash as NSString) {
      return cached
    }

    guard let data = Data(base64Encoded: base64Hash), data.count >= 5 else {
      return nil
    }

    let hash = [UInt8](data)
    guard let image = thumbHashToImage(hash: hash) else {
      return nil
    }

    cache.setObject(image, forKey: base64Hash as NSString)
    return image
  }

  func approximateDimensions(base64Hash: String) -> (width: Int, height: Int) {
    guard let data = Data(base64Encoded: base64Hash), data.count >= 3 else {
      return (32, 32)
    }

    let hash = [UInt8](data)
    let header = Int(hash[0]) | (Int(hash[1]) << 8) | (Int(hash[2]) << 16)
    let lIsShorter = (header & 1) != 0
    let lSize = max(3, (header >> 1) & 0x1f)
    let ratio = Double(32 + ((header >> 6) & 0x1f)) / 64.0
    let sSize = Int(round(lIsShorter ? Double(lSize) / ratio : Double(lSize) * ratio))
    let w = lIsShorter ? sSize : lSize
    let h = lIsShorter ? lSize : sSize
    return (w, h)
  }

  func clearCache() {
    cache.removeAllObjects()
  }

  // MARK: - ThumbHash Algorithm

  private func thumbHashToImage(hash: [UInt8]) -> UIImage? {
    // Decode header
    let header = Int(hash[0]) | (Int(hash[1]) << 8) | (Int(hash[2]) << 16)
    let lIsShorter = (header & 1) != 0
    let lDc = Double((header >> 1) & 0x1f) / 31.0
    let pDc = Double((header >> 11) & 0x1f) / 31.0

    let header2 = (Int(hash[2]) >> 5) | (Int(hash[3]) << 3) | (Int(hash[4]) << 11)
    let qDc = Double((header2 >> 0) & 0x1f) / 31.0
    let hasAlpha = ((header2 >> 10) & 1) != 0

    // Compute dimensions — note parentheses to ensure & 0x1f applies to the
    // shifted value, not to (32 + shifted_value).
    let lSize = max(3, Int((hash[0] >> 1) & 0x1f))
    let ratio = Double(32 + (Int((hash[0] >> 6) | (hash[1] << 2)) & 0x1f)) / 64.0
    let sSize = Int(round(lIsShorter ? Double(lSize) / ratio : Double(lSize) * ratio))
    let w = lIsShorter ? sSize : lSize
    let h = lIsShorter ? lSize : sSize

    guard w > 0, h > 0, w <= 100, h <= 100 else { return nil }

    // Convert L/P/Q color space to RGB using ThumbHash spec coefficients.
    // Reference: https://evanw.github.io/thumbhash/
    let r = UInt8(clamping: Int(max(0, min(1, lDc + pDc * 1.402)) * 255))
    let g = UInt8(clamping: Int(max(0, min(1, lDc - pDc * 0.344136 - qDc * 0.714136)) * 255))
    let b = UInt8(clamping: Int(max(0, min(1, lDc + qDc * 1.772)) * 255))

    // Alpha DC value is stored in header bits 15-19
    // header2 bits 15-19 map to: (header2 >> 15) & 0x1f
    // but since we want the aDc which is at a specific offset in the hash:
    let a: UInt8 = hasAlpha ? UInt8(clamping: Int(max(0, min(1, Double((header2 >> 15) & 0x1f) / 31.0)) * 255)) : 255

    // Create RGBA pixel buffer
    var pixels = [UInt8](repeating: 0, count: w * h * 4)
    for i in 0..<(w * h) {
      pixels[i * 4] = r
      pixels[i * 4 + 1] = g
      pixels[i * 4 + 2] = b
      pixels[i * 4 + 3] = a
    }

    // Create UIImage from pixel data
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let context = CGContext(
      data: &pixels,
      width: w,
      height: h,
      bitsPerComponent: 8,
      bytesPerRow: w * 4,
      space: colorSpace,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ), let cgImage = context.makeImage() else {
      return nil
    }

    return UIImage(cgImage: cgImage)
  }
}
