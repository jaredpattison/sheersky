package expo.modules.applock

import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class ExpoAppLockModule : Module(), DefaultLifecycleObserver {
  private var backgroundTimestamp: Long = 0L

  override fun definition() =
    ModuleDefinition {
      Name("ExpoAppLock")

      Events("onLockStateChange")

      OnCreate {
        // ProcessLifecycleOwner is a process-level API — no Activity needed.
        // Post to main looper to ensure lifecycle is ready.
        Handler(Looper.getMainLooper()).post {
          ProcessLifecycleOwner.get().lifecycle.addObserver(this@ExpoAppLockModule)
        }
      }

      OnDestroy {
        ProcessLifecycleOwner.get().lifecycle.removeObserver(this@ExpoAppLockModule)
      }

      Function("getSupportedAuthTypes") {
        val context = appContext.reactContext ?: return@Function listOf("none")
        val manager = BiometricManager.from(context)

        val types = mutableListOf<String>()
        val biometricResult = manager.canAuthenticate(
          BiometricManager.Authenticators.BIOMETRIC_STRONG or
            BiometricManager.Authenticators.BIOMETRIC_WEAK
        )
        if (biometricResult == BiometricManager.BIOMETRIC_SUCCESS) {
          types.add("biometric")
        }

        // Device credential (PIN/pattern/password) is always available if set
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          val credentialResult = manager.canAuthenticate(
            BiometricManager.Authenticators.DEVICE_CREDENTIAL
          )
          if (credentialResult == BiometricManager.BIOMETRIC_SUCCESS) {
            types.add("passcode")
          }
        } else {
          // Pre-Android 11, device credential is typically available
          types.add("passcode")
        }

        return@Function if (types.isEmpty()) listOf("none") else types
      }

      Function("isAvailable") {
        val context = appContext.reactContext ?: return@Function false
        val manager = BiometricManager.from(context)
        val result = manager.canAuthenticate(
          BiometricManager.Authenticators.BIOMETRIC_STRONG or
            BiometricManager.Authenticators.BIOMETRIC_WEAK or
            BiometricManager.Authenticators.DEVICE_CREDENTIAL
        )
        return@Function result == BiometricManager.BIOMETRIC_SUCCESS
      }

      AsyncFunction("authenticateAsync") { reason: String ->
        val activity = appContext.currentActivity as? FragmentActivity
          ?: return@AsyncFunction mapOf("success" to false, "error" to "No activity")

        val executor = ContextCompat.getMainExecutor(activity)
        @Volatile var resultMap: Map<String, Any?> = emptyMap()
        val latch = CountDownLatch(1)

        activity.runOnUiThread {
          val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
              resultMap = mapOf("success" to true)
              latch.countDown()
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
              resultMap = mapOf("success" to false, "error" to errString.toString())
              latch.countDown()
            }

            override fun onAuthenticationFailed() {
              // Called on each failed attempt, but the prompt stays open.
              // We don't resolve here — wait for success or error.
            }
          }

          val prompt = BiometricPrompt(activity, executor, callback)
          val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(reason)
            .setAllowedAuthenticators(
              BiometricManager.Authenticators.BIOMETRIC_STRONG or
                BiometricManager.Authenticators.BIOMETRIC_WEAK or
                BiometricManager.Authenticators.DEVICE_CREDENTIAL
            )
            .build()

          prompt.authenticate(promptInfo)
        }

        // Timeout after 60s to prevent permanent thread blocking if the
        // BiometricPrompt is dismissed without firing a callback.
        val completed = latch.await(60, TimeUnit.SECONDS)
        if (!completed) {
          return@AsyncFunction mapOf("success" to false, "error" to "Authentication timed out")
        }
        return@AsyncFunction resultMap
      }
    }

  // MARK: - Lifecycle Observer

  override fun onStop(owner: LifecycleOwner) {
    backgroundTimestamp = System.currentTimeMillis()
  }

  override fun onStart(owner: LifecycleOwner) {
    if (backgroundTimestamp == 0L) return

    val elapsed = (System.currentTimeMillis() - backgroundTimestamp) / 1000
    backgroundTimestamp = 0L

    sendEvent("onLockStateChange", mapOf(
      "secondsInBackground" to elapsed.toInt(),
    ))
  }
}
