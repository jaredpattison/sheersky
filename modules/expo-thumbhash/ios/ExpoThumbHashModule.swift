import Foundation
import ExpoModulesCore

public class ExpoThumbHashModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoThumbHash")

    // MARK: - Functions

    AsyncFunction("decodeToDataURIAsync") { (base64Hash: String, promise: Promise) in
      // Decode on background thread — PNG encoding is expensive
      DispatchQueue.global(qos: .userInitiated).async {
        guard let image = ThumbHashDecoder.shared.decode(base64Hash: base64Hash),
              let pngData = image.pngData()
        else {
          promise.resolve(nil as String?)
          return
        }
        promise.resolve("data:image/png;base64," + pngData.base64EncodedString())
      }
    }

    Function("approximateDimensions") { (base64Hash: String) -> [String: Int] in
      let (w, h) = ThumbHashDecoder.shared.approximateDimensions(base64Hash: base64Hash)
      return ["width": w, "height": h]
    }

    Function("clearCache") {
      ThumbHashDecoder.shared.clearCache()
    }

    // MARK: - View

    View(ThumbHashView.self) {
      Prop("thumbHash") { (view: ThumbHashView, prop: String) in
        view.thumbHash = prop
      }

      Prop("crossFadeDuration") { (view: ThumbHashView, prop: Double) in
        view.crossFadeDuration = prop / 1000.0 // ms → seconds
      }
    }
  }
}
