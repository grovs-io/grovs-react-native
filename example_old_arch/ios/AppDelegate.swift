import UIKit
import React
import React_RCTAppDelegate
import Grovs

@main
class AppDelegate: RCTAppDelegate {
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    self.moduleName = "example_old_arch"

    // You can add your custom initial props in the dictionary below.
    // They will be passed down to the ViewController used by React Native.
    self.initialProps = [:]

    // TODO: Replace with your own API Key
    let apiKey = "grovsr_69240ef41a592e76da5527abd7b39cc379dd02d0762ed5c25ec29fa3084b6ed5"
    Grovs.configure(APIKey: apiKey, useTestEnvironment: false, autoTrackScreenViews: false, delegate: nil)
    Grovs.setDebug(level: .info)

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
}
