import Foundation
import ExpoModulesCore

public class ExpoSecureCredentialsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoSecureCredentials")

    Function("canUseSecureStorage") {
      return true
    }

    AsyncFunction("setItemAsync") { (key: String, value: String) in
      try KeychainHelper.shared.set(value, forKey: key)
    }

    AsyncFunction("getItemAsync") { (key: String) -> String? in
      return try KeychainHelper.shared.get(forKey: key)
    }

    AsyncFunction("deleteItemAsync") { (key: String) in
      KeychainHelper.shared.delete(forKey: key)
    }
  }
}
