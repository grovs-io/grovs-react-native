package com.grovswrapper

import android.os.Handler
import android.os.Looper
import android.app.Activity
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import io.grovs.Grovs
import io.grovs.model.CustomLinkRedirect
import io.grovs.service.CustomRedirects
import io.grovs.service.TrackingParams
import io.grovs.model.events.PaymentEventType
import io.grovs.utils.InstantCompat
import io.grovs.utils.flow
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import java.io.Serializable

class GrovsWrapperModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var incomingDeeplinksJob: Job? = null

  init {
    GrovsInAppEvents.install()
    GrovsPush.fetchFirebaseToken(reactContext)
    reactContext.addActivityEventListener(GrovsPush)
  }

  private fun rejectIfDisabled(promise: Promise): Boolean {
    if (GrovsConsent.isEnabled(reactApplicationContext)) return false
    promise.reject(GrovsConsent.DISABLED_ERROR_CODE, GrovsConsent.DISABLED_ERROR_MESSAGE)
    return true
  }

  override fun getName(): String = "GrovsWrapper"

  @ReactMethod
  fun setIdentifier(identifier: String?) {
    Grovs.identifier = identifier
  }

  @ReactMethod
  fun setPushToken(pushToken: String?) {
    Grovs.pushToken = pushToken
  }

  @ReactMethod
  fun setAttributes(attributes: ReadableMap?) {
    Grovs.attributes = attributes?.toMap()?.toSerializableMap()
  }

  @ReactMethod
  fun setSDK(enabled: Boolean) {
    GrovsConsent.setEnabled(reactApplicationContext, enabled)
    Grovs.setSDK(enabled = enabled)
    if (enabled) {
      GrovsPush.fetchFirebaseToken(reactApplicationContext)
      // Retry a launch link that arrived while consent was disabled.
      Handler(Looper.getMainLooper()).post {
        if (GrovsConsent.isEnabled(reactApplicationContext)) {
          reactApplicationContext.currentActivity?.let { Grovs.onStart(launcherActivity = it) }
        }
      }
    }
  }

  @ReactMethod
  fun setDebug(level: String) {
    when (level) {
      "info" -> Grovs.setDebug(io.grovs.model.LogLevel.INFO)
      "error" -> Grovs.setDebug(io.grovs.model.LogLevel.ERROR)
    }
  }

  @ReactMethod
  fun track(name: String, properties: ReadableMap?, tags: ReadableArray?) {
    Grovs.track(
      name = name,
      properties = properties?.toMap()?.toSerializableMap(),
      tags = tags?.toList()?.toStringList()
    )
  }

  @ReactMethod
  fun trackScreenView(screenName: String, properties: ReadableMap?) {
    Grovs.trackScreenView(
      screenName = screenName,
      properties = properties?.toMap()?.toSerializableMap()
    )
  }

  @ReactMethod
  fun setGlobalTags(tags: ReadableArray?) {
    Grovs.setGlobalTags(tags = tags?.toList()?.toStringList())
  }

  @ReactMethod
  fun setScreenAliases(aliases: ReadableMap?) {
    val stringAliases = aliases?.toMap()
      ?.mapNotNull { (key, value) -> (value as? String)?.let { key to it } }
      ?.toMap() ?: return
    Grovs.setScreenAliases(stringAliases)
  }

  @ReactMethod
  fun generateLink(
    title: String?,
    subtitle: String?,
    imageURL: String?,
    data: ReadableMap?,
    tags: ReadableArray?,
    customRedirects: ReadableMap?,
    showPreviewIos: Boolean?,
    showPreviewAndroid: Boolean?,
    tracking: ReadableMap?,
    copyToClipboardIos: Boolean?,
    copyToClipboardAndroid: Boolean?,
    promise: Promise
  ) {
    if (rejectIfDisabled(promise)) return
    val redirects = customRedirects?.toMap()?.toSerializableMap()
    val ios = redirects?.get("ios") as? Map<*, *>
    val iosUrl = ios?.get("link") as? String
    val iosOpenIfInstalled = ios?.get("open_if_app_installed") as? Boolean

    val android = redirects?.get("android") as? Map<*, *>
    val androidUrl = android?.get("link") as? String
    val androidOpenIfInstalled = android?.get("open_if_app_installed") as? Boolean

    val desktop = redirects?.get("desktop") as? Map<*, *>
    val desktopUrl = desktop?.get("link") as? String
    val desktopOpenIfInstalled = desktop?.get("open_if_app_installed") as? Boolean

    val nativeCustomRedirect = CustomRedirects(
      ios = iosUrl?.let {
        CustomLinkRedirect(it, iosOpenIfInstalled ?: true)
      },
      android = androidUrl?.let {
        CustomLinkRedirect(it, androidOpenIfInstalled ?: true)
      },
      desktop = desktopUrl?.let {
        CustomLinkRedirect(it, desktopOpenIfInstalled ?: true)
      }
    )

    val trackingParams = tracking?.toMap()?.toSerializableMap()
    val utmCampaign = trackingParams?.get("utm_campaign") as? String
    val utmSource = trackingParams?.get("utm_source") as? String
    val utmMedium = trackingParams?.get("utm_medium") as? String

    val nativeTracking = TrackingParams(
      utmCampaign = utmCampaign,
      utmSource = utmSource,
      utmMedium = utmMedium
    )

    Grovs.generateLink(
      title = title,
      subtitle = subtitle,
      imageURL = imageURL,
      data = data?.toMap()?.toSerializableMap(),
      tags = tags?.toList()?.toStringList(),
      customRedirects = nativeCustomRedirect,
      showPreviewIos = showPreviewIos,
      showPreviewAndroid = showPreviewAndroid,
      copyToClipboardIos = copyToClipboardIos,
      copyToClipboardAndroid = copyToClipboardAndroid,
      tracking = nativeTracking,
      lifecycleOwner = null,
      listener = { link, error ->
        link?.let {
          promise.resolve(it)
        } ?: error?.let {
          promise.reject("Error", it.toString())
        } ?: promise.reject("Error", "Failed to generate link.")
      }
    )
  }

  @ReactMethod
  fun displayMessages(promise: Promise) {
    if (rejectIfDisabled(promise)) return
    Grovs.displayMessagesFragment {
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun numberOfUnreadMessages(promise: Promise) {
    if (rejectIfDisabled(promise)) return
    Grovs.numberOfUnreadMessages {
      it?.let { promise.resolve(it) } ?: promise.reject("Error", "Failed to fetch messages number.")
    }
  }

  @ReactMethod
  fun linkDetails(path: String, promise: Promise) {
    if (rejectIfDisabled(promise)) return
    Grovs.linkDetails(path = path, lifecycleOwner = null) { details, error ->
      details?.let { promise.resolve(it.toWritableMap()) }
        ?: promise.reject("Error", error?.message ?: "Failed to get link details.")
    }
  }

  @ReactMethod
  fun logInAppPurchase(transactionId: String?, originalJson: String?, promise: Promise) {
    // transactionId is iOS-only; Android logs the Play Billing purchase JSON.
    if (originalJson == null) {
      promise.resolve(false)
      return
    }
    Grovs.logInAppPurchase(originalJson = originalJson)
    promise.resolve(true)
  }

  @ReactMethod
  fun logCustomPurchase(
    type: String,
    priceInCents: Double,
    currency: String,
    productId: String,
    startDate: String?,
    promise: Promise
  ) {
    val paymentType = when (type) {
      "cancel" -> PaymentEventType.CANCEL
      "refund" -> PaymentEventType.REFUND
      else -> PaymentEventType.BUY
    }

    val start = startDate?.let { iso ->
      runCatching { InstantCompat.parse(iso) }.getOrNull()
    } ?: InstantCompat.now()

    Grovs.logCustomPurchase(
      type = paymentType,
      priceInCents = priceInCents.toInt(),
      currency = currency,
      productId = productId,
      startDate = start
    )
    promise.resolve(true)
  }

  @ReactMethod
  fun markReadyToHandleDeeplinks() {
    val activity: AppCompatActivity? = reactApplicationContext.currentActivity as? AppCompatActivity
    activity?.let { activity ->
      incomingDeeplinksJob?.cancel()
      incomingDeeplinksJob = activity.lifecycleScope.launchWhenStarted {
        Grovs.Companion::openedLinkDetails.flow.collect { deeplinkDetails ->
          deeplinkDetails?.let {
            val writableMap = Arguments.createMap()
            it.link?.let { link -> writableMap.putString("link", link) }
            it.data?.let { writableMap.putMap("data", it.toWritableMap()) }
            it.tracking?.let { writableMap.putMap("tracking", it.toWritableMap()) }

            if (!isActive) {
              return@collect
            }

            reactContext
              .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
              .emit("onGrovsDeeplinkReceived", writableMap)
            //emitOnDeeplinkReceived(writableMap)
          }
        }
      }
    }
  }

  @ReactMethod
  fun pauseInAppMessages() {
    Grovs.pauseInAppMessages()
  }

  @ReactMethod
  fun resumeInAppMessages() {
    Grovs.resumeInAppMessages()
  }

  @ReactMethod
  fun discardInAppMessages(dismissCurrent: Boolean) {
    Grovs.discardInAppMessages(dismissCurrent)
  }

  @ReactMethod
  fun setInAppExcludedScreens(screens: ReadableArray) {
    Grovs.setInAppExcludedScreens(screens.toList().toStringList())
  }

  @ReactMethod
  fun setInAppDebugLogging(enabled: Boolean) {
    Grovs.setInAppDebugLogging(enabled)
  }

  @ReactMethod
  fun markReadyForInAppEvents() {
    GrovsInAppEvents.markReady(emitInAppMessage)
  }

  @ReactMethod
  fun handleNotificationOpen(data: ReadableMap, promise: Promise) {
    GrovsPush.handleNotificationOpen(data.toMap(), reactApplicationContext.currentActivity, promise::resolve)
  }

  @ReactMethod
  fun isGrovsNotification(data: ReadableMap, promise: Promise) {
    promise.resolve(GrovsPush.isGrovsNotification(data.toMap()))
  }

  @ReactMethod
  fun addListener(eventName: String?) {}

  @ReactMethod
  fun removeListeners(count: Double) {}

  private val emitInAppMessage: (WritableMap) -> Unit = { data ->
    if (reactContext.hasActiveReactInstance()) {
      try {
        reactContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit("onGrovsInAppMessage", data)
      } catch (_: RuntimeException) {
      }
    }
  }

  override fun invalidate() {
    GrovsInAppEvents.detach(emitInAppMessage)
    super.invalidate()
  }
}
