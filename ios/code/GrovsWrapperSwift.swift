import Grovs
import UIKit

@objc
public class GrovsWrapperSwift: NSObject {
  @objc
  public static let shared = GrovsWrapperSwift()
  @objc
  public var bridgeLoaded: Bool = false {
    didSet {
      if bridgeLoaded, let deferredDeeplinkData {
        didReceiveDeeplink?(deferredDeeplinkData)
      }
      deferredDeeplinkData = nil
    }
  }
  
  private var deferredDeeplinkData: [String : Any]?
  
  // JS API
  
  @objc
  public var didReceiveDeeplink: (([String : Any])->())? = nil
  
  /// One-shot observer used to re-assert the delegate once app launch completes.
  private var launchObserver: NSObjectProtocol?

  public override init() {
    super.init()

    // Attach as the SDK delegate. Startup ordering between this singleton's
    // creation and the host app's `Grovs.configure` call is not guaranteed:
    // the SDK drops delegate assignments made before it is configured, and
    // `configure` builds the manager from its own `delegate:` parameter. The
    // assignment below covers the created-after-configure ordering; for the
    // created-before-configure ordering, `configure` is called inside
    // `application(_:didFinishLaunchingWithOptions:)` and UIKit posts
    // `didFinishLaunchingNotification` right after it returns, so re-asserting
    // there deterministically covers the early case.
    Grovs.delegate = self

    launchObserver = NotificationCenter.default.addObserver(
      forName: UIApplication.didFinishLaunchingNotification,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      guard let self else { return }
      Grovs.delegate = self
      if let launchObserver = self.launchObserver {
        NotificationCenter.default.removeObserver(launchObserver)
        self.launchObserver = nil
      }
    }
  }
  
  @objc
  public func setIdentifier(_ identifier: String) {
    Grovs.userIdentifier = identifier
  }

  @objc
  public func setPushToken(_ pushToken: String) {
    Grovs.pushToken = pushToken
  }

  @objc
  public func setAttributes(_ attributes: [String: Any]) {
    Grovs.userAttributes = attributes
  }

  private static let sdkEnabledKey = "io.grovs.wrapper.sdkEnabled"

  /// Restores consent for configure before React Native starts. Defaults to true.
  @objc
  public static func isSDKEnabled() -> Bool {
    let defaults = UserDefaults.standard
    guard defaults.object(forKey: sdkEnabledKey) != nil else { return true }
    return defaults.bool(forKey: sdkEnabledKey)
  }

  @objc
  public func setSDK(_ enabled: Bool) {
    UserDefaults.standard.set(enabled, forKey: Self.sdkEnabledKey)
    Grovs.setSDK(enabled: enabled)
  }

  @objc
  public func setDebug(_ level: String) {
    if (level == "info") {
      Grovs.setDebug(level: .info)
    } else if (level == "error") {
      Grovs.setDebug(level: .error)
    }
  }

  @objc
  public func track(_ name: String, properties: [String: Any]?, tags: [String]?) {
    Grovs.track(name, properties: properties, tags: tags)
  }

  @objc
  public func trackScreenView(_ screenName: String, properties: [String: Any]?) {
    Grovs.trackScreenView(screenName, properties: properties)
  }

  @objc
  public func setGlobalTags(_ tags: [String]?) {
    Grovs.setGlobalTags(tags)
  }

  @objc
  public func setScreenAliases(_ aliases: [String: Any]) {
    // The legacy bridge delivers an untyped NSDictionary; keep only string values.
    let stringAliases = aliases.compactMapValues { $0 as? String }
    Grovs.setScreenAliases(stringAliases)
  }

  @objc
  public func generateLink(title: String?,
                                  subtitle: String?,
                                  imageURL: String?,
                                  data: [String: Any]?,
                                  tags: [String]?,
                                  customRedirects: [String: Any]?,
                                  showPreviewIos: NSNumber?,
                                  showPreviewAndroid: NSNumber?,
                                  tracking: [String: String]?,
                                  copyToClipboardIos: NSNumber?,
                                  copyToClipboardAndroid: NSNumber?,
                                  completion: @escaping GrovsURLClosure) {
    let iosRedirect = customRedirects?["ios"] as? [String: Any?]
    let androidRedirect = customRedirects?["android"] as? [String: Any?]
    let desktopRedirect = customRedirects?["desktop"] as? [String: Any?]

    var customRedirectIos: CustomLinkRedirect?
    if let iosLink = iosRedirect?["link"] as? String {
      customRedirectIos = CustomLinkRedirect(link: iosLink, openAppIfInstalled: iosRedirect?["open_if_app_installed"] as? Bool ?? true)
    }

    var customRedirectAndroid: CustomLinkRedirect?
    if let androidLink = androidRedirect?["link"] as? String {
      customRedirectAndroid = CustomLinkRedirect(link: androidLink, openAppIfInstalled: androidRedirect?["open_if_app_installed"] as? Bool ?? true)
    }

    var customRedirectDesktop: CustomLinkRedirect?
    if let desktopLink = desktopRedirect?["link"] as? String {
      customRedirectDesktop = CustomLinkRedirect(link: desktopLink, openAppIfInstalled: desktopRedirect?["open_if_app_installed"] as? Bool ?? true)
    }

    let redirects = CustomRedirects(ios: customRedirectIos,
                                    android: customRedirectAndroid,
                                    desktop: customRedirectDesktop)

    Grovs.generateLink(title: title,
                       subtitle: subtitle,
                       imageURL: imageURL,
                       data: data,
                       tags: tags,
                       customRedirects: redirects,
                       showPreviewiOS: showPreviewIos?.boolValue,
                       showPreviewAndroid: showPreviewAndroid?.boolValue,
                       copyToClipboardiOS: copyToClipboardIos?.boolValue,
                       copyToClipboardAndroid: copyToClipboardAndroid?.boolValue,
                       trackingCampaign: tracking?["utm_campaign"] as? String,
                       trackingSource: tracking?["utm_source"] as? String,
                       trackingMedium: tracking?["utm_medium"] as? String,
                       completion: completion)
  }
  
  @objc
  public func numberOfUnreadMessages(completion: @escaping (_ value: Int) -> Void) {
    Grovs.numberOfUnreadMessages(completion: { value in
      if let value = value {
        completion(value)
      } else {
        completion(-1)
      }
    })
  }
  
  @objc
  public func displayMessagesViewController(completion: GrovsEmptyClosure?) {
    DispatchQueue.main.async {
      Grovs.displayMessagesViewController(completion: completion)
    }
  }

  @objc
  public func logInAppPurchase(_ transactionId: String, completion: @escaping (_ success: Bool) -> Void) {
    guard let id = UInt64(transactionId) else {
      completion(false)
      return
    }
    if #available(iOS 15.0, *) {
      Grovs.logInAppPurchase(transactionID: id) { success in
        completion(success)
      }
    } else {
      completion(false)
    }
  }

  @objc
  public func logCustomPurchase(type: String,
                                priceInCents: Int,
                                currency: String,
                                productId: String,
                                startDate: String?,
                                completion: @escaping (_ success: Bool) -> Void) {
    let transactionType: TransactionType
    switch type {
    case "cancel": transactionType = .cancel
    case "refund": transactionType = .refund
    default: transactionType = .buy
    }

    var date: Date? = nil
    if let startDate = startDate {
      let formatter = ISO8601DateFormatter()
      date = formatter.date(from: startDate)
    }

    Grovs.logCustomPurchase(type: transactionType,
                            priceInCents: priceInCents,
                            currency: currency,
                            productID: productId,
                            startDate: date) { success in
      completion(success)
    }
  }

}

extension GrovsWrapperSwift: GrovsDelegate {
  public func grovsReceivedPayloadFromDeeplink(link: String?, payload: [String : Any]?, tracking: [String : Any]?) {
    var deeplinkData = [String : Any]()
    if let link {
      deeplinkData["link"] = link
    }
    if let payload {
      deeplinkData["data"] = payload
    }
    if let tracking {
      deeplinkData["tracking"] = tracking
    }
    if bridgeLoaded {
      didReceiveDeeplink?(deeplinkData)
    } else {
      deferredDeeplinkData = deeplinkData
    }
  }

}
