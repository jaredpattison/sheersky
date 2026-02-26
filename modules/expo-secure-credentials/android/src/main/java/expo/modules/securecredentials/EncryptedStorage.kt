package expo.modules.securecredentials

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.io.IOException
import java.security.GeneralSecurityException

/**
 * Wrapper around Android's EncryptedSharedPreferences backed by the
 * Android Keystore system. Values are encrypted with AES-256-GCM;
 * keys are encrypted with AES-256-SIV (deterministic so lookups work).
 */
class EncryptedStorage(context: Context) {
  private val prefs: SharedPreferences

  init {
    try {
      val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

      prefs = EncryptedSharedPreferences.create(
        context,
        PREFS_FILE,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
      )
    } catch (e: GeneralSecurityException) {
      throw Error("Failed to initialize secure storage: ${e.message}", e)
    } catch (e: IOException) {
      throw Error("Failed to initialize secure storage: ${e.message}", e)
    }
  }

  fun set(key: String, value: String) {
    // Use commit() (synchronous) instead of apply() to ensure the write
    // is persisted before the JS promise resolves. apply() is async and
    // can lose writes if the app is killed shortly after.
    val success = prefs.edit().putString(key, value).commit()
    if (!success) {
      throw Error("Failed to write to secure storage")
    }
  }

  fun get(key: String): String? {
    return prefs.getString(key, null)
  }

  fun delete(key: String) {
    prefs.edit().remove(key).commit()
  }

  companion object {
    private const val PREFS_FILE = "sheersky_secure_credentials"
  }
}
