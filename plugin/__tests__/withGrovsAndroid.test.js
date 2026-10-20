const {
  readGrovsSdkCoordinate,
  addGrovsConsentImportToMainApplication,
  addGrovsImportToMainApplication,
  addGrovsConfigure,
  addGrovsImportToMainActivity,
  addGrovsIntentImport,
  addGrovsOnStart,
  addGrovsOnNewIntent,
  addGrovsFirebaseDependency,
  addGrovsPushManifestEntries,
  hasThirdPartyPushLibrary,
} = require('../withGrovsAndroid');
const withGrovsAndroid = require('../withGrovsAndroid');
const {
  withAppBuildGradle,
  withMainApplication,
  withAndroidManifest,
} = require('expo/config-plugins');
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('withGrovsAndroid - SDK dependency', () => {
  afterEach(() => jest.restoreAllMocks());

  it('reads the SDK coordinate from the wrapper Gradle properties', () => {
    expect(readGrovsSdkCoordinate()).toBe('io.grovs:Grovs:3.1.0');
  });

  it('ignores comments and trims the configured coordinate', () => {
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(
        '# GrovsWrapper_grovsSdkCoordinate=old\r\n GrovsWrapper_grovsSdkCoordinate = io.grovs:Grovs:3.1.0 \r\n'
      );
    expect(readGrovsSdkCoordinate()).toBe('io.grovs:Grovs:3.1.0');
  });

  it.each(['', 'GrovsWrapper_grovsSdkCoordinate='])(
    'fails clearly when the SDK coordinate is missing (%j)',
    (properties) => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue(properties);
      expect(() => readGrovsSdkCoordinate()).toThrow(
        'GrovsWrapper_grovsSdkCoordinate'
      );
    }
  );

  function transformDependency(contents) {
    withAppBuildGradle.mockClear();
    withGrovsAndroid({}, { apiKey: 'key', scheme: 'grovs' });
    const transform = withAppBuildGradle.mock.calls[0][1];
    return transform({ modResults: { language: 'groovy', contents } })
      .modResults.contents;
  }

  it('injects the configured coordinate once into app dependencies', () => {
    const first = transformDependency(
      "dependencies {\n    implementation 'com.example:other:1.0.0'\n}\n"
    );
    expect(first).toContain(
      "implementation 'io.grovs:Grovs:3.1.0' // react-native-grovs-wrapper:dep"
    );
    expect(first).toContain("implementation 'com.example:other:1.0.0'");
    expect(transformDependency(first)).toBe(first);
  });

  it('replaces an older marked dependency using the current configured coordinate', () => {
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(
        'GrovsWrapper_grovsSdkCoordinate=io.grovs:Grovs:3.1.0\n'
      );
    const first = transformDependency(
      "dependencies {\n    implementation 'io.grovs:Grovs:1.2.0' // react-native-grovs-wrapper:dep\n}\n"
    );
    expect(first).toContain(
      "implementation 'io.grovs:Grovs:3.1.0' // react-native-grovs-wrapper:dep"
    );
    expect(first).not.toContain('1.2.0');
    expect(transformDependency(first)).toBe(first);
  });
});

const SAMPLE_MAIN_APPLICATION = `package com.myapp

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
  }
}`;

const SAMPLE_MAIN_ACTIVITY = `package com.myapp

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "MyApp"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}`;

describe('withGrovsAndroid - MainApplication transforms', () => {
  it('adds the consent import only once', () => {
    const first = addGrovsConsentImportToMainApplication(
      SAMPLE_MAIN_APPLICATION
    );
    expect(first).toContain('import com.grovswrapper.GrovsConsent');
    expect(addGrovsConsentImportToMainApplication(first)).toBe(first);
  });

  it('places the consent import after the package when there are no imports', () => {
    expect(
      addGrovsConsentImportToMainApplication(
        'package com.myapp\n\nclass MainApplication {}'
      )
    ).toBe(
      'package com.myapp\n\nimport com.grovswrapper.GrovsConsent\n\nclass MainApplication {}'
    );
  });

  it('adds the consent import after an import at the end of the file', () => {
    expect(
      addGrovsConsentImportToMainApplication('import android.app.Application')
    ).toBe(
      'import android.app.Application\nimport com.grovswrapper.GrovsConsent'
    );
  });

  it('wires the consent import and configure call into the Expo mod', () => {
    withMainApplication.mockClear();
    withGrovsAndroid({}, { apiKey: 'key', scheme: 'grovs' });
    const transform = withMainApplication.mock.calls[0][1];
    const config = {
      modResults: { language: 'kt', contents: SAMPLE_MAIN_APPLICATION },
    };
    const result = transform(config).modResults.contents;
    expect(result).toContain('import com.grovswrapper.GrovsConsent');
    expect(result).toContain('enabled = GrovsConsent.isEnabled(this)');
    expect(transform(config).modResults.contents).toBe(result);
  });

  describe('addGrovsImportToMainApplication', () => {
    it('adds Grovs import after last import', () => {
      const result = addGrovsImportToMainApplication(SAMPLE_MAIN_APPLICATION);
      expect(result).toContain('import io.grovs.Grovs');
      const grovsIndex = result.indexOf('import io.grovs.Grovs');
      const soloaderIndex = result.indexOf(
        'import com.facebook.soloader.SoLoader'
      );
      expect(grovsIndex).toBeGreaterThan(soloaderIndex);
    });

    it('does not duplicate import', () => {
      const first = addGrovsImportToMainApplication(SAMPLE_MAIN_APPLICATION);
      const second = addGrovsImportToMainApplication(first);
      const count = (second.match(/import io\.grovs\.Grovs/g) || []).length;
      expect(count).toBe(1);
    });
  });

  describe('addGrovsConfigure', () => {
    it.each([undefined, []])(
      'passes null for absent or empty clipboard domains (%j)',
      (clipboardDomains) => {
        const result = addGrovsConfigure(SAMPLE_MAIN_APPLICATION, {
          apiKey: 'key',
          useTestEnvironment: false,
          clipboardDomains,
        });
        expect(result).toContain('clipboardDomains = null');
        expect(result).toContain('enabled = GrovsConsent.isEnabled(this)');
      }
    );

    it('passes provided clipboard domains', () => {
      const result = addGrovsConfigure(SAMPLE_MAIN_APPLICATION, {
        apiKey: 'key',
        useTestEnvironment: false,
        clipboardDomains: ['a.example', 'b.example'],
      });
      expect(result).toContain(
        'clipboardDomains = listOf("a.example", "b.example")'
      );
      expect(result).toContain('enabled = GrovsConsent.isEnabled(this)');
    });

    it('adds Grovs.configure after super.onCreate()', () => {
      const result = addGrovsConfigure(SAMPLE_MAIN_APPLICATION, {
        apiKey: 'test-key',
        useTestEnvironment: true,
      });
      expect(result).toContain(
        'Grovs.configure(this, "test-key", useTestEnvironment = true, baseURL = null, autoTrackScreenViews = false, clipboardDomains = null, enabled = GrovsConsent.isEnabled(this))'
      );
      const configIndex = result.indexOf('Grovs.configure');
      const superIndex = result.indexOf('super.onCreate()');
      expect(configIndex).toBeGreaterThan(superIndex);
    });

    it('uses false for production environment', () => {
      const result = addGrovsConfigure(SAMPLE_MAIN_APPLICATION, {
        apiKey: 'prod-key',
        useTestEnvironment: false,
      });
      expect(result).toContain('useTestEnvironment = false');
    });

    it('adds baseURL when provided', () => {
      const result = addGrovsConfigure(SAMPLE_MAIN_APPLICATION, {
        apiKey: 'key',
        useTestEnvironment: false,
        baseURL: 'https://custom.example.com',
      });
      expect(result).toContain(
        'Grovs.configure(this, "key", useTestEnvironment = false, baseURL = "https://custom.example.com", autoTrackScreenViews = false, clipboardDomains = null, enabled = GrovsConsent.isEnabled(this))'
      );
    });

    it('passes baseURL = null when not provided', () => {
      const result = addGrovsConfigure(SAMPLE_MAIN_APPLICATION, {
        apiKey: 'key',
        useTestEnvironment: false,
        baseURL: null,
      });
      expect(result).toContain('baseURL = null');
      expect(result).not.toContain('baseURL = "');
    });

    it('does not duplicate configuration', () => {
      const first = addGrovsConfigure(SAMPLE_MAIN_APPLICATION, {
        apiKey: 'key',
        useTestEnvironment: false,
      });
      const second = addGrovsConfigure(first, {
        apiKey: 'key',
        useTestEnvironment: false,
      });
      const count = (second.match(/Grovs\.configure/g) || []).length;
      expect(count).toBe(1);
    });
  });
});

describe('withGrovsAndroid - MainActivity transforms', () => {
  describe('addGrovsImportToMainActivity', () => {
    it('adds Grovs import', () => {
      const result = addGrovsImportToMainActivity(SAMPLE_MAIN_ACTIVITY);
      expect(result).toContain('import io.grovs.Grovs');
    });

    it('does not duplicate import', () => {
      const first = addGrovsImportToMainActivity(SAMPLE_MAIN_ACTIVITY);
      const second = addGrovsImportToMainActivity(first);
      const count = (second.match(/import io\.grovs\.Grovs/g) || []).length;
      expect(count).toBe(1);
    });
  });

  describe('addGrovsIntentImport', () => {
    it('adds Intent import', () => {
      const result = addGrovsIntentImport(SAMPLE_MAIN_ACTIVITY);
      expect(result).toContain('import android.content.Intent');
    });

    it('does not duplicate import', () => {
      const first = addGrovsIntentImport(SAMPLE_MAIN_ACTIVITY);
      const second = addGrovsIntentImport(first);
      const count = (second.match(/import android\.content\.Intent/g) || [])
        .length;
      expect(count).toBe(1);
    });
  });

  describe('addGrovsOnStart', () => {
    it('adds onStart override with Grovs.onStart', () => {
      const result = addGrovsOnStart(SAMPLE_MAIN_ACTIVITY);
      expect(result).toContain('override fun onStart()');
      expect(result).toContain('super.onStart()');
      expect(result).toContain('Grovs.onStart(launcherActivity = this)');
    });

    it('does not duplicate onStart', () => {
      const first = addGrovsOnStart(SAMPLE_MAIN_ACTIVITY);
      const second = addGrovsOnStart(first);
      const count = (second.match(/Grovs\.onStart/g) || []).length;
      expect(count).toBe(1);
    });
  });

  describe('addGrovsOnNewIntent', () => {
    it('adds onNewIntent override with Grovs.onNewIntent', () => {
      const result = addGrovsOnNewIntent(SAMPLE_MAIN_ACTIVITY);
      expect(result).toContain('override fun onNewIntent(intent: Intent)');
      expect(result).toContain('super.onNewIntent(intent)');
      const superIndex = result.indexOf('super.onNewIntent(intent)');
      const setIntentIndex = result.indexOf('setIntent(intent)');
      const grovsIndex = result.indexOf('Grovs.onNewIntent(intent,');
      expect(setIntentIndex).toBeGreaterThan(superIndex);
      expect(grovsIndex).toBeGreaterThan(setIntentIndex);
      expect(result).toContain(
        'Grovs.onNewIntent(intent, launcherActivity = this)'
      );
    });

    it('does not duplicate onNewIntent', () => {
      const first = addGrovsOnNewIntent(SAMPLE_MAIN_ACTIVITY);
      const second = addGrovsOnNewIntent(first);
      const count = (second.match(/Grovs\.onNewIntent/g) || []).length;
      expect(count).toBe(1);
    });
  });

  describe('full transform pipeline', () => {
    it('produces valid MainActivity with all modifications', () => {
      let result = SAMPLE_MAIN_ACTIVITY;
      result = addGrovsImportToMainActivity(result);
      result = addGrovsIntentImport(result);
      result = addGrovsOnStart(result);
      result = addGrovsOnNewIntent(result);

      expect(result).toContain('import io.grovs.Grovs');
      expect(result).toContain('import android.content.Intent');
      expect(result).toContain('Grovs.onStart');
      expect(result).toContain('Grovs.onNewIntent');
    });

    it('is idempotent when run twice', () => {
      function applyAll(input) {
        let r = input;
        r = addGrovsImportToMainActivity(r);
        r = addGrovsIntentImport(r);
        r = addGrovsOnStart(r);
        r = addGrovsOnNewIntent(r);
        return r;
      }

      const first = applyAll(SAMPLE_MAIN_ACTIVITY);
      const second = applyAll(first);
      expect(first).toBe(second);
    });
  });
});

describe('withGrovsAndroid - push', () => {
  const GRADLE =
    "dependencies {\n    implementation 'com.example:other:1.0.0'\n}\n";
  const FIREBASE_LINE =
    "implementation 'com.google.firebase:firebase-messaging:24.0.3' // react-native-grovs-wrapper:firebase";

  function manifestFixture() {
    return {
      manifest: {
        '$': { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
        'uses-permission': [
          { $: { 'android:name': 'android.permission.INTERNET' } },
        ],
        'application': [{ $: { 'android:name': '.MainApplication' } }],
      },
    };
  }

  describe('addGrovsFirebaseDependency', () => {
    it('adds the marked line once', () => {
      const first = addGrovsFirebaseDependency(GRADLE);
      expect(first).toContain(FIREBASE_LINE);
      expect(first).toContain("implementation 'com.example:other:1.0.0'");
      expect(addGrovsFirebaseDependency(first)).toBe(first);
    });
  });

  describe('addGrovsPushManifestEntries', () => {
    const options = { removeGrovsService: false, notificationIcon: undefined };

    it('adds POST_NOTIFICATIONS once, even if the app declares it', () => {
      const manifest = addGrovsPushManifestEntries(manifestFixture(), options);
      addGrovsPushManifestEntries(manifest, options);
      const names = manifest.manifest['uses-permission'].map(
        (p) => p.$['android:name']
      );
      expect(
        names.filter((n) => n === 'android.permission.POST_NOTIFICATIONS')
      ).toHaveLength(1);

      const declared = manifestFixture();
      declared.manifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.POST_NOTIFICATIONS' },
      });
      addGrovsPushManifestEntries(declared, options);
      expect(declared.manifest['uses-permission']).toHaveLength(2);
    });

    it('removes the Grovs messaging service once and declares tools', () => {
      const manifest = manifestFixture();
      const opts = { ...options, removeGrovsService: true };
      addGrovsPushManifestEntries(manifest, opts);
      addGrovsPushManifestEntries(manifest, opts);
      expect(manifest.manifest.$['xmlns:tools']).toBe(
        'http://schemas.android.com/tools'
      );
      expect(manifest.manifest.application[0].service).toEqual([
        {
          $: {
            'android:name': 'io.grovs.handlers.MessagingService',
            'tools:node': 'remove',
          },
        },
      ]);
    });

    it('leaves the service alone when not asked to remove it', () => {
      const manifest = addGrovsPushManifestEntries(manifestFixture(), options);
      expect(manifest.manifest.application[0].service).toBeUndefined();
      expect(manifest.manifest.$['xmlns:tools']).toBeUndefined();
    });

    it('adds the notification icon meta-data once', () => {
      const manifest = manifestFixture();
      const opts = { ...options, notificationIcon: 'ic_stat' };
      addGrovsPushManifestEntries(manifest, opts);
      addGrovsPushManifestEntries(manifest, opts);
      expect(manifest.manifest.application[0]['meta-data']).toEqual([
        {
          $: {
            'android:name': 'io.grovs.NotificationIconSmall',
            'android:resource': '@drawable/ic_stat',
          },
        },
      ]);
    });

    it('produces an identical manifest when run twice', () => {
      const opts = { removeGrovsService: true, notificationIcon: 'ic_stat' };
      const once = addGrovsPushManifestEntries(manifestFixture(), opts);
      const snapshot = JSON.stringify(once);
      expect(JSON.stringify(addGrovsPushManifestEntries(once, opts))).toBe(
        snapshot
      );
    });
  });

  describe('hasThirdPartyPushLibrary', () => {
    let dir;
    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grovs-plugin-'));
    });
    afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

    function writePackage(contents) {
      fs.writeFileSync(
        path.join(dir, 'package.json'),
        JSON.stringify(contents)
      );
    }

    it.each([
      [{ dependencies: { '@react-native-firebase/messaging': '1' } }],
      [{ devDependencies: { 'expo-notifications': '1' } }],
    ])('is true when a push library is listed (%j)', (pkg) => {
      writePackage(pkg);
      expect(hasThirdPartyPushLibrary(dir)).toBe(true);
    });

    it('is false when none is listed', () => {
      writePackage({ dependencies: { react: '1' } });
      expect(hasThirdPartyPushLibrary(dir)).toBe(false);
    });

    it('is false when package.json is missing or unreadable', () => {
      expect(hasThirdPartyPushLibrary(dir)).toBe(false);
      fs.writeFileSync(path.join(dir, 'package.json'), '{not json');
      expect(hasThirdPartyPushLibrary(dir)).toBe(false);
    });
  });

  describe('wiring', () => {
    const props = { apiKey: 'key', scheme: 'grovs', associatedDomains: [] };
    let dir;
    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grovs-plugin-'));
      withAppBuildGradle.mockClear();
      withAndroidManifest.mockClear();
    });
    afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

    function runGradle(extra) {
      withAppBuildGradle.mockClear();
      withGrovsAndroid({}, { ...props, ...extra });
      return withAppBuildGradle.mock.calls.map(
        ([, fn]) =>
          fn({
            modRequest: { projectRoot: dir },
            modResults: { contents: GRADLE },
          }).modResults.contents
      );
    }

    function runManifest(extra) {
      withAndroidManifest.mockClear();
      withGrovsAndroid({}, { ...props, ...extra });
      const manifest = manifestFixture();
      const mods = withAndroidManifest.mock.calls.map(([, fn]) => fn);
      // The first mod is the existing intent-filter one.
      mods
        .slice(1)
        .forEach((fn) =>
          fn({ modRequest: { projectRoot: dir }, modResults: manifest })
        );
      return { manifest, extraMods: mods.length - 1 };
    }

    it('adds no push changes when push and the icon are off', () => {
      expect(runGradle({ push: false })).toHaveLength(1);
      expect(runGradle({ push: false })[0]).not.toContain('firebase');
      expect(runManifest({ push: false }).extraMods).toBe(0);
    });

    it('adds the Firebase dependency when push is on', () => {
      const [, withFirebase] = runGradle({ push: true });
      expect(withFirebase).toContain(FIREBASE_LINE);
    });

    it('skips the Firebase dependency with react-native-firebase', () => {
      fs.writeFileSync(
        path.join(dir, 'package.json'),
        JSON.stringify({
          dependencies: { '@react-native-firebase/messaging': '1' },
        })
      );
      const [, withFirebase] = runGradle({ push: true });
      expect(withFirebase).not.toContain('firebase-messaging');
    });

    it('removes the Grovs service when another push library exists', () => {
      fs.writeFileSync(
        path.join(dir, 'package.json'),
        JSON.stringify({ dependencies: { 'expo-notifications': '1' } })
      );
      const { manifest } = runManifest({ push: true });
      expect(manifest.manifest.application[0].service).toHaveLength(1);
    });

    it('adds the icon without push and without the push permission', () => {
      const { manifest } = runManifest({
        push: false,
        androidNotificationIcon: 'ic_stat',
      });
      expect(manifest.manifest.application[0]['meta-data']).toHaveLength(1);
      expect(manifest.manifest['uses-permission']).toHaveLength(1);
    });
  });
});
