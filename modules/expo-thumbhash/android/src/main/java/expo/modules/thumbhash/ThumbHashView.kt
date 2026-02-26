package expo.modules.thumbhash

import android.content.Context
import android.graphics.Bitmap
import android.widget.ImageView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ThumbHashView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext) {

  private val imageView = ImageView(context).apply {
    scaleType = ImageView.ScaleType.CENTER_CROP
    layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
  }

  // Scoped coroutine that is cancelled when the view is detached
  private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
  private var currentJob: Job? = null

  /** Cross-fade duration in milliseconds */
  var crossFadeDuration: Int = 200

  var thumbHash: String? = null
    set(value) {
      field = value
      updateImage()
    }

  init {
    this.addView(imageView)
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    scope.cancel()
  }

  private fun updateImage() {
    // Cancel any in-flight decode
    currentJob?.cancel()

    val hash = thumbHash ?: run {
      imageView.setImageBitmap(null)
      return
    }

    currentJob = scope.launch {
      val bitmap: Bitmap? = ThumbHashDecoder.decode(hash)

      withContext(Dispatchers.Main) {
        // Verify the prop hasn't changed while we were decoding
        if (thumbHash != hash) return@withContext

        if (crossFadeDuration > 0 && bitmap != null) {
          imageView.alpha = 0f
          imageView.setImageBitmap(bitmap)
          imageView.animate()
            .alpha(1f)
            .setDuration(crossFadeDuration.toLong())
            .start()
        } else {
          imageView.setImageBitmap(bitmap)
        }
      }
    }
  }
}
