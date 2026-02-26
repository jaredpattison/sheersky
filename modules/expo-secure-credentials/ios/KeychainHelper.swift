import Foundation
import Security

/// Low-level wrapper around the iOS Keychain Services API (Security.framework).
/// All items are stored as `kSecClassGenericPassword` with a fixed service name
/// so they're grouped together and easy to query/delete.
final class KeychainHelper {
  static let shared = KeychainHelper()

  private let service = "app.sheersky.credentials"

  private init() {}

  // MARK: - Public API

  func set(_ value: String, forKey key: String) throws {
    guard let data = value.data(using: .utf8) else {
      throw KeychainError.encodingFailed
    }

    // Delete any existing item first to avoid errSecDuplicateItem
    delete(forKey: key)

    let query: [CFString: Any] = [
      kSecClass: kSecClassGenericPassword,
      kSecAttrService: service,
      kSecAttrAccount: key,
      kSecValueData: data,
      kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
    ]

    let status = SecItemAdd(query as CFDictionary, nil)
    guard status == errSecSuccess else {
      throw KeychainError.unhandledError(status: status)
    }
  }

  func get(forKey key: String) throws -> String? {
    let query: [CFString: Any] = [
      kSecClass: kSecClassGenericPassword,
      kSecAttrService: service,
      kSecAttrAccount: key,
      kSecReturnData: true,
      kSecMatchLimit: kSecMatchLimitOne,
    ]

    var result: AnyObject?
    let status = SecItemCopyMatching(query as CFDictionary, &result)

    switch status {
    case errSecSuccess:
      guard let data = result as? Data,
            let string = String(data: data, encoding: .utf8)
      else {
        throw KeychainError.decodingFailed
      }
      return string

    case errSecItemNotFound:
      return nil

    default:
      throw KeychainError.unhandledError(status: status)
    }
  }

  @discardableResult
  func delete(forKey key: String) -> Bool {
    let query: [CFString: Any] = [
      kSecClass: kSecClassGenericPassword,
      kSecAttrService: service,
      kSecAttrAccount: key,
    ]

    let status = SecItemDelete(query as CFDictionary)
    return status == errSecSuccess || status == errSecItemNotFound
  }
}

// MARK: - Errors

enum KeychainError: Error, LocalizedError {
  case encodingFailed
  case decodingFailed
  case unhandledError(status: OSStatus)

  var errorDescription: String? {
    switch self {
    case .encodingFailed:
      return "Failed to encode value for Keychain storage"
    case .decodingFailed:
      return "Failed to decode value from Keychain"
    case .unhandledError(let status):
      return "Keychain error: \(status)"
    }
  }
}
