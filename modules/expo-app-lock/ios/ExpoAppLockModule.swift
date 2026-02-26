import Foundation
import ExpoModulesCore
import LocalAuthentication

public class ExpoAppLockModule: Module {
  /// Timestamp when the app entered background, used to calculate seconds away
  private var backgroundTimestamp: Date?

  public func definition() -> ModuleDefinition {
    Name("ExpoAppLock")

    // Declare the event that will be emitted to JS
    Events("onLockStateChange")

    // MARK: - Synchronous Functions

    Function("getSupportedAuthTypes") { () -> [String] in
      var types: [String] = []
      let context = LAContext()
      var error: NSError?

      if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
        types.append("biometric")
      }
      if context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) {
        types.append("passcode")
      }

      return types.isEmpty ? ["none"] : types
    }

    Function("isAvailable") { () -> Bool in
      let context = LAContext()
      var error: NSError?
      // deviceOwnerAuthentication allows either biometric OR passcode
      return context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error)
    }

    // MARK: - Async Functions

    AsyncFunction("authenticateAsync") { (reason: String, promise: Promise) in
      let context = LAContext()
      context.localizedFallbackTitle = "Use Passcode"

      context.evaluatePolicy(
        .deviceOwnerAuthentication,
        localizedReason: reason
      ) { success, error in
        if success {
          promise.resolve(["success": true])
        } else {
          let errorMessage: String
          if let laError = error as? LAError {
            switch laError.code {
            case .userCancel:
              errorMessage = "User cancelled authentication"
            case .userFallback:
              errorMessage = "User chose passcode fallback"
            case .authenticationFailed:
              errorMessage = "Authentication failed"
            case .biometryNotAvailable:
              errorMessage = "Biometry not available"
            case .biometryNotEnrolled:
              errorMessage = "Biometry not enrolled"
            case .biometryLockout:
              errorMessage = "Biometry is locked out"
            default:
              errorMessage = error?.localizedDescription ?? "Unknown error"
            }
          } else {
            errorMessage = error?.localizedDescription ?? "Unknown error"
          }
          promise.resolve(["success": false, "error": errorMessage])
        }
      }
    }

    // MARK: - Lifecycle Hooks

    OnAppEntersBackground {
      self.backgroundTimestamp = Date()
    }

    OnAppEntersForeground {
      guard let timestamp = self.backgroundTimestamp else { return }
      let elapsed = Date().timeIntervalSince(timestamp)
      self.backgroundTimestamp = nil

      self.sendEvent("onLockStateChange", [
        "secondsInBackground": Int(elapsed),
      ])
    }
  }
}
