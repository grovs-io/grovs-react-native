import Grovs

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
  
  public override init() {
    super.init()
    
    Grovs.delegate = self
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

  @objc
  public func setSDK(_ enabled: Bool) {
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
  public func generateLink(title: String?,
                                  subtitle: String?,
                                  imageURL: String?,
                                  data: [String: Any]?,
                                  tags: [String]?,
                                  customRedirects: [String: Any]?,
                                  showPreviewIos: Bool,
                                  showPreviewAndroid: Bool,
                                  tracking: [String: String]?,
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
                       showPreviewiOS: showPreviewIos,
                       showPreviewAndroid: showPreviewAndroid,
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
