const {
  addGrovsImport,
  addGrovsConfiguration,
  addGrovsUniversalLinkHandler,
  addGrovsURLHandler,
} = require('../withGrovsIOS');

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
    it('adds Grovs.configure before return super.application', () => {
      const result = addGrovsConfiguration(SAMPLE_APP_DELEGATE, {
        apiKey: 'test-key-123',
        useTestEnvironment: true,
      });
      expect(result).toContain(
        'Grovs.configure(APIKey: "test-key-123", useTestEnvironment: true, delegate: nil)'
      );
      // Should appear before return super.application
      const configIndex = result.indexOf('Grovs.configure');
      const returnIndex = result.indexOf(
        'return super.application(application, didFinishLaunchingWithOptions'
      );
      expect(configIndex).toBeLessThan(returnIndex);
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
      expect(result).toContain('baseURL: "https://custom.example.com"');
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
