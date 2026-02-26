package expo.modules.thumbhash

import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoThumbHashModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("ExpoThumbHash")

      AsyncFunction("decodeToDataURIAsync") { base64Hash: String ->
        val bitmap = ThumbHashDecoder.decode(base64Hash) ?: return@AsyncFunction null

        val stream = java.io.ByteArrayOutputStream()
        bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, stream)
        val pngBytes = stream.toByteArray()
        val pngBase64 = Base64.encodeToString(pngBytes, Base64.NO_WRAP)

        return@AsyncFunction "data:image/png;base64,$pngBase64"
      }

      Function("approximateDimensions") { base64Hash: String ->
        val (w, h) = ThumbHashDecoder.approximateDimensions(base64Hash)
        return@Function mapOf("width" to w, "height" to h)
      }

      Function("clearCache") {
        ThumbHashDecoder.clearCache()
      }

      View(ThumbHashView::class) {
        Prop("thumbHash") { view: ThumbHashView, hash: String ->
          view.thumbHash = hash
        }

        Prop("crossFadeDuration") { view: ThumbHashView, duration: Int ->
          view.crossFadeDuration = duration
        }
      }
    }
}
