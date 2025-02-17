import Grovs

@objc
public class GrovsWrapperSwift: NSObject {
  @objc
  public static let shared = GrovsWrapperSwift()
  
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
                                  completion: @escaping GrovsURLClosure) {
    Grovs.generateLink(title: title, subtitle: subtitle, imageURL: imageURL, data: data, tags: tags, completion: completion)
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
  
  public func grovsReceivedPayloadFromDeeplink(payload: [String : Any]) {
    didReceiveDeeplink?(payload)
  }

}
