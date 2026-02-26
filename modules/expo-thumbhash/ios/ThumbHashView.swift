import ExpoModulesCore
import UIKit

public class ThumbHashView: ExpoView {
  private let imageView = UIImageView(frame: .zero)

  var thumbHash: String? {
    didSet {
      updateImage()
    }
  }

  var crossFadeDuration: Double = 0.2

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    self.clipsToBounds = true

    imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    imageView.contentMode = .scaleAspectFill
    imageView.backgroundColor = .clear

    self.addSubview(imageView)
  }

  private func updateImage() {
    guard let hash = thumbHash else {
      imageView.image = nil
      return
    }

    // Capture the hash at dispatch time to check for staleness after decode
    let capturedHash = hash

    // Decode on background thread
    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      let image = ThumbHashDecoder.shared.decode(base64Hash: capturedHash)

      DispatchQueue.main.async {
        guard let self = self else { return }

        // Verify the prop hasn't changed while we were decoding
        guard self.thumbHash == capturedHash else { return }

        if self.crossFadeDuration > 0 {
          UIView.transition(
            with: self.imageView,
            duration: self.crossFadeDuration,
            options: .transitionCrossDissolve,
            animations: {
              self.imageView.image = image
            }
          )
        } else {
          self.imageView.image = image
        }
      }
    }
  }
}
