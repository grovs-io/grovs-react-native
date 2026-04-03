const {
  addGrovsImportToMainApplication,
  addGrovsConfigure,
  addGrovsImportToMainActivity,
  addGrovsIntentImport,
  addGrovsOnStart,
  addGrovsOnNewIntent,
} = require('../withGrovsAndroid');

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
    it('adds Grovs.configure after super.onCreate()', () => {
      const result = addGrovsConfigure(SAMPLE_MAIN_APPLICATION, {
        apiKey: 'test-key',
        useTestEnvironment: true,
      });
      expect(result).toContain(
        'Grovs.configure(this, "test-key", useTestEnvironment = true)'
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
      expect(result).toContain('baseURL = "https://custom.example.com"');
    });

    it('omits baseURL when not provided', () => {
      const result = addGrovsConfigure(SAMPLE_MAIN_APPLICATION, {
        apiKey: 'key',
        useTestEnvironment: false,
        baseURL: null,
      });
      expect(result).not.toContain('baseURL');
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
