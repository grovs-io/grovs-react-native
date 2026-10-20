import UIKit
import UserNotifications
import React
import React_RCTAppDelegate
import Grovs
import react_native_grovs_wrapper

@main
class AppDelegate: RCTAppDelegate, UNUserNotificationCenterDelegate {
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    self.moduleName = "example_old_arch"

    // You can add your custom initial props in the dictionary below.
    // They will be passed down to the ViewController used by React Native.
    self.initialProps = [:]

    // TODO: Replace with your own API Key
    let apiKey = "grovst_06e36086dad3e934289560e3ca59527282030868f8c844629516c6e6c67bbf1f"
    Grovs.configure(APIKey: apiKey, useTestEnvironment: true, autoTrackScreenViews: false, clipboardDomains: nil, enabled: GrovsWrapperSwift.isSDKEnabled(), delegate: GrovsWrapperSwift.shared)
    Grovs.setDebug(level: .info)

    UNUserNotificationCenter.current().delegate = self
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
      guard granted else { return }
      DispatchQueue.main.async {
        application.registerForRemoteNotifications()
      }
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
  
  // Handle universal link continuation
  override func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    return Grovs.handleAppDelegate(continue: userActivity, restorationHandler: restorationHandler)
  }

  // Handle URI opening
  override func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
      return Grovs.handleAppDelegate(open: url, options: options)
  }

  override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Grovs.setPushToken(deviceToken: deviceToken)
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    _ = Grovs.handleNotificationResponse(response)
    completionHandler()
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([.banner, .list, .sound])
  }
}
