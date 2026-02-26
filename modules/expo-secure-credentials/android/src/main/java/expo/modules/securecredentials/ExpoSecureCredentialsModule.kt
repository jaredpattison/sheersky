package expo.modules.securecredentials

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoSecureCredentialsModule : Module() {
  private fun getContext(): Context {
    return appContext.reactContext ?: throw Error("React context is null")
  }

  // Lazy-initialize to avoid re-deriving MasterKey on every bridge call.
  // EncryptedSharedPreferences.create() is expensive (crypto operations).
  private val storage: EncryptedStorage by lazy {
    EncryptedStorage(getContext())
  }

  override fun definition() =
    ModuleDefinition {
      Name("ExpoSecureCredentials")

      Function("canUseSecureStorage") {
        return@Function true
      }

      AsyncFunction("setItemAsync") { key: String, value: String ->
        storage.set(key, value)
      }

      AsyncFunction("getItemAsync") { key: String ->
        return@AsyncFunction storage.get(key)
      }

      AsyncFunction("deleteItemAsync") { key: String ->
        storage.delete(key)
      }
    }
}
