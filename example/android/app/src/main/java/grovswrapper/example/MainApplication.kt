package grovswrapper.example

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

import io.grovs.Grovs
import io.grovs.model.LogLevel
import com.grovswrapper.GrovsConsent

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              add(ExampleStorePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()

    val prefs = ExampleStore.prefs(this)
    ExampleStore.startedProfile = try {
      configure(ExampleStore.activeProfile(prefs))
    } catch (e: Exception) {
      ExampleStore.configureError = e.message ?: e.toString()
      configure(Profile.DEFAULT)
    }
    val debugLevel = if (prefs.getString(ExampleStore.KEY_DEBUG_LEVEL, null) == "error") LogLevel.ERROR else LogLevel.INFO
    Grovs.setDebug(debugLevel)

    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
  }

  private fun configure(profile: Profile): Profile {
    Grovs.configure(
      this,
      profile.apiKey,
      useTestEnvironment = profile.test,
      baseURL = profile.baseUrl,
      autoTrackScreenViews = profile.autoTrack,
      clipboardDomains = profile.clipboardDomains.ifEmpty { null },
      enabled = profile.startEnabled && GrovsConsent.isEnabled(this),
    )
    return profile
  }
}
