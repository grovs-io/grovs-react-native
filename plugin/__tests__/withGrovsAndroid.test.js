const {
  readGrovsSdkCoordinate,
  addGrovsConsentImportToMainApplication,
  addGrovsImportToMainApplication,
  addGrovsConfigure,
  addGrovsImportToMainActivity,
  addGrovsIntentImport,
  addGrovsOnStart,
  addGrovsOnNewIntent,
} = require('../withGrovsAndroid');
const withGrovsAndroid = require('../withGrovsAndroid');
const {
  withAppBuildGradle,
  withMainApplication,
} = require('expo/config-plugins');
const fs = require('fs');

describe('withGrovsAndroid - SDK dependency', () => {
  afterEach(() => jest.restoreAllMocks());

  it('reads the SDK coordinate from the wrapper Gradle properties', () => {
    expect(readGrovsSdkCoordinate()).toBe('io.grovs:Grovs:3.0.0');
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
      "implementation 'io.grovs:Grovs:3.0.0' // react-native-grovs-wrapper:dep"
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
