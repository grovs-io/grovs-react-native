const {
  addGrovsImport,
  addGrovsConfiguration,
  addGrovsUniversalLinkHandler,
  addGrovsURLHandler,
  addGrovsPushTokenHandler,
  addGrovsNotificationResponseHandler,
} = require('../withGrovsIOS');
const withGrovsIOS = require('../withGrovsIOS');
const {
  withEntitlementsPlist,
  withAppDelegate,
} = require('expo/config-plugins');

const SAMPLE_APP_DELEGATE = `import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: RCTAppDelegate {
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    self.moduleName = "MyApp"
    self.dependencyProvider = RCTAppDependencyProvider()
    self.initialProps = [:]

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
  }
}`;

describe('withGrovsIOS - AppDelegate transforms', () => {
  describe('addGrovsImport', () => {
    it('adds import Grovs after last import', () => {
      const result = addGrovsImport(SAMPLE_APP_DELEGATE);
      expect(result).toContain('import Grovs');
      // Should be after ReactAppDependencyProvider import
      const grovsIndex = result.indexOf('import Grovs');
      const depProviderIndex = result.indexOf(
        'import ReactAppDependencyProvider'
      );
      expect(grovsIndex).toBeGreaterThan(depProviderIndex);
    });

    it('does not duplicate import', () => {
      const first = addGrovsImport(SAMPLE_APP_DELEGATE);
      const second = addGrovsImport(first);
      const count = (second.match(/import Grovs/g) || []).length;
      expect(count).toBe(1);
    });
  });

  describe('addGrovsConfiguration', () => {
    it.each([undefined, []])(
      'omits absent or empty clipboard domains (%j)',
      (clipboardDomains) => {
        const result = addGrovsConfiguration(SAMPLE_APP_DELEGATE, {
          apiKey: 'key',
          useTestEnvironment: false,
          clipboardDomains,
        });
        expect(result).not.toContain('clipboardDomains:');
        expect(result).toContain('enabled: GrovsWrapperSwift.isSDKEnabled()');
      }
    );

    it('passes provided clipboard domains', () => {
      const result = addGrovsConfiguration(SAMPLE_APP_DELEGATE, {
        apiKey: 'key',
        useTestEnvironment: false,
        clipboardDomains: ['a.example', 'b.example'],
      });
      expect(result).toContain('clipboardDomains: ["a.example", "b.example"]');
      expect(result).toContain('enabled: GrovsWrapperSwift.isSDKEnabled()');
      expect(result).toContain('delegate: GrovsWrapperSwift.shared');
    });

    it('adds Grovs.configure synchronously after super.application returns', () => {
      const result = addGrovsConfiguration(SAMPLE_APP_DELEGATE, {
        apiKey: 'test-key-123',
        useTestEnvironment: true,
      });
      expect(result).toContain(
        'Grovs.configure(APIKey: "test-key-123", useTestEnvironment: true, autoTrackScreenViews: false, enabled: GrovsWrapperSwift.isSDKEnabled(), delegate: GrovsWrapperSwift.shared)'
      );
      // Configure must run AFTER super.application(_:didFinishLaunchingWithOptions:)
      // returns (the dev-launcher window setup happens inside super; running
      // configure before super interrupts it and produces a black screen on
      // Expo SDK 54). It must also be synchronous; deferring with
      // DispatchQueue.main.async breaks the Grovs SDK's background NSURLSession
      // and `generateLink` calls hang forever.
      const superCallIndex = result.indexOf(
        'let didFinishLaunchingResult = super.application(application, didFinishLaunchingWithOptions: launchOptions)'
      );
      const configIndex = result.indexOf('Grovs.configure');
      const returnIndex = result.indexOf('return didFinishLaunchingResult');
      expect(superCallIndex).toBeGreaterThan(-1);
      expect(configIndex).toBeGreaterThan(superCallIndex);
      expect(returnIndex).toBeGreaterThan(configIndex);
      expect(result).not.toContain('DispatchQueue.main.async');
    });

    it('uses false for production environment', () => {
      const result = addGrovsConfiguration(SAMPLE_APP_DELEGATE, {
        apiKey: 'prod-key',
        useTestEnvironment: false,
      });
      expect(result).toContain('useTestEnvironment: false');
    });

    it('adds baseURL when provided', () => {
      const result = addGrovsConfiguration(SAMPLE_APP_DELEGATE, {
        apiKey: 'key',
        useTestEnvironment: false,
        baseURL: 'https://custom.example.com',
      });
      expect(result).toContain(
        'Grovs.configure(APIKey: "key", useTestEnvironment: false, baseURL: "https://custom.example.com", autoTrackScreenViews: false, enabled: GrovsWrapperSwift.isSDKEnabled(), delegate: GrovsWrapperSwift.shared)'
      );
    });

    it('omits baseURL when not provided', () => {
      const result = addGrovsConfiguration(SAMPLE_APP_DELEGATE, {
        apiKey: 'key',
        useTestEnvironment: false,
        baseURL: null,
      });
      expect(result).not.toContain('baseURL');
    });

    it('does not duplicate configuration', () => {
      const first = addGrovsConfiguration(SAMPLE_APP_DELEGATE, {
        apiKey: 'key',
        useTestEnvironment: false,
      });
      const second = addGrovsConfiguration(first, {
        apiKey: 'key',
        useTestEnvironment: false,
      });
      const count = (second.match(/Grovs\.configure/g) || []).length;
      expect(count).toBe(1);
    });
  });

  describe('addGrovsUniversalLinkHandler', () => {
    it('adds continue userActivity handler', () => {
      const result = addGrovsUniversalLinkHandler(SAMPLE_APP_DELEGATE);
      expect(result).toContain('continue userActivity: NSUserActivity');
      expect(result).toContain(
        'Grovs.handleAppDelegate(continue: userActivity'
      );
    });

    it('does not duplicate handler', () => {
      const first = addGrovsUniversalLinkHandler(SAMPLE_APP_DELEGATE);
      const second = addGrovsUniversalLinkHandler(first);
      const count = (second.match(/Grovs\.handleAppDelegate\(continue:/g) || [])
        .length;
      expect(count).toBe(1);
    });
  });

  describe('addGrovsURLHandler', () => {
    it('adds open url handler', () => {
      const result = addGrovsURLHandler(SAMPLE_APP_DELEGATE);
      expect(result).toContain('open url: URL');
      expect(result).toContain('Grovs.handleAppDelegate(open: url');
    });

    it('does not duplicate handler', () => {
      const first = addGrovsURLHandler(SAMPLE_APP_DELEGATE);
      const second = addGrovsURLHandler(first);
      const count = (second.match(/Grovs\.handleAppDelegate\(open:/g) || [])
        .length;
      expect(count).toBe(1);
    });
  });

  describe('full transform pipeline', () => {
    it('produces valid AppDelegate with all modifications', () => {
      let result = SAMPLE_APP_DELEGATE;
      result = addGrovsImport(result);
      result = addGrovsConfiguration(result, {
        apiKey: 'my-api-key',
        useTestEnvironment: true,
      });
      result = addGrovsUniversalLinkHandler(result);
      result = addGrovsURLHandler(result);

      expect(result).toContain('import Grovs');
      expect(result).toContain('Grovs.configure(APIKey: "my-api-key"');
      expect(result).toContain('Grovs.handleAppDelegate(continue:');
      expect(result).toContain('Grovs.handleAppDelegate(open:');

      // Verify ordering: import -> configure -> handlers
      const importIdx = result.indexOf('import Grovs');
      const configIdx = result.indexOf('Grovs.configure');
      const continueIdx = result.indexOf('Grovs.handleAppDelegate(continue:');
      const openIdx = result.indexOf('Grovs.handleAppDelegate(open:');

      expect(importIdx).toBeLessThan(configIdx);
      expect(configIdx).toBeLessThan(continueIdx);
      expect(continueIdx).toBeLessThan(openIdx);
    });

    it('is idempotent when run twice', () => {
      function applyAll(input) {
        let r = input;
        r = addGrovsImport(r);
        r = addGrovsConfiguration(r, {
          apiKey: 'key',
          useTestEnvironment: false,
        });
        r = addGrovsUniversalLinkHandler(r);
        r = addGrovsURLHandler(r);
        return r;
      }

      const first = applyAll(SAMPLE_APP_DELEGATE);
      const second = applyAll(first);
      expect(first).toBe(second);
    });
  });
});

describe('withGrovsIOS - push', () => {
  describe('addGrovsPushTokenHandler', () => {
    it('adds a token method that calls super then the SDK', () => {
      const result = addGrovsPushTokenHandler(SAMPLE_APP_DELEGATE);
      const method = result.slice(
        result.indexOf('didRegisterForRemoteNotificationsWithDeviceToken')
      );
      expect(result).toContain(
        'public override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {'
      );
      expect(method.indexOf('super.application(')).toBeLessThan(
        method.indexOf('Grovs.setPushToken(deviceToken: deviceToken)')
      );
      expect(result.lastIndexOf('}')).toBe(result.length - 1);
      expect(result.indexOf('setPushToken')).toBeLessThan(
        result.lastIndexOf('}')
      );
    });

    it('inserts only the call into an existing method', () => {
      const existing = SAMPLE_APP_DELEGATE.replace(
        /\}$/,
        `
  public override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }
}`
      );
      const result = addGrovsPushTokenHandler(existing);
      expect(result).toContain(
        'deviceToken: Data) {\n    Grovs.setPushToken(deviceToken: deviceToken)\n    super.application('
      );
      expect(
        result.match(
          /didRegisterForRemoteNotificationsWithDeviceToken deviceToken/g
        )
      ).toHaveLength(1);
    });

    it('is idempotent', () => {
      const first = addGrovsPushTokenHandler(SAMPLE_APP_DELEGATE);
      expect(addGrovsPushTokenHandler(first)).toBe(first);
    });
  });

  describe('addGrovsNotificationResponseHandler', () => {
    it('adds the import once and the response method', () => {
      const result = addGrovsNotificationResponseHandler(SAMPLE_APP_DELEGATE);
      expect(result.match(/import UserNotifications/g)).toHaveLength(1);
      expect(result).toContain(
        'public func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {'
      );
      expect(result).toContain('Grovs.handleNotificationResponse(response)');
      expect(result).toContain('completionHandler()');
      expect(result).not.toContain('override func userNotificationCenter');
      expect(result).not.toContain(
        'UNUserNotificationCenter.current().delegate'
      );
    });

    it('does not duplicate an existing UserNotifications import', () => {
      const result = addGrovsNotificationResponseHandler(
        `import UserNotifications\n${SAMPLE_APP_DELEGATE}`
      );
      expect(result.match(/import UserNotifications/g)).toHaveLength(1);
    });

    it('inserts only the call into an existing method', () => {
      const existing = SAMPLE_APP_DELEGATE.replace(
        /\}$/,
        `
  public func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    completionHandler()
  }
}`
      );
      const result = addGrovsNotificationResponseHandler(existing);
      expect(result).toContain(
        '@escaping () -> Void) {\n    Grovs.handleNotificationResponse(response)\n    completionHandler()'
      );
      expect(result.match(/func userNotificationCenter/g)).toHaveLength(1);
    });

    it('is idempotent', () => {
      const first = addGrovsNotificationResponseHandler(SAMPLE_APP_DELEGATE);
      expect(addGrovsNotificationResponseHandler(first)).toBe(first);
    });
  });

  describe('wiring', () => {
    const props = { apiKey: 'key', scheme: 'grovs', associatedDomains: [] };

    function runAppDelegate(extra) {
      withAppDelegate.mockClear();
      withGrovsIOS({}, { ...props, ...extra });
      const transform = withAppDelegate.mock.calls[0][1];
      return transform({
        modResults: { language: 'swift', contents: SAMPLE_APP_DELEGATE },
      }).modResults.contents;
    }

    function runEntitlements(modResults, extra) {
      withEntitlementsPlist.mockClear();
      withGrovsIOS({}, { ...props, ...extra });
      return withEntitlementsPlist.mock.calls.map(
        ([, fn]) => fn({ modResults }).modResults
      );
    }

    it('leaves the AppDelegate untouched by push when push is off', () => {
      const off = runAppDelegate({ push: false });
      expect(off).not.toContain('setPushToken');
      expect(off).not.toContain('handleNotificationResponse');
      expect(off).not.toContain('UserNotifications');
      expect(runAppDelegate({})).toBe(off);
    });

    it('adds the push handlers when push is on', () => {
      const on = runAppDelegate({ push: true });
      expect(on).toContain('Grovs.setPushToken');
      expect(on).toContain('Grovs.handleNotificationResponse');
    });

    it('sets aps-environment to development only when missing', () => {
      const [missing] = runEntitlements({}, { push: true });
      expect(missing['aps-environment']).toBe('development');
      const [existing] = runEntitlements(
        { 'aps-environment': 'production' },
        { push: true }
      );
      expect(existing['aps-environment']).toBe('production');
    });

    it('does not touch entitlements when push is off', () => {
      expect(runEntitlements({}, { push: false })).toEqual([]);
    });
  });
});
