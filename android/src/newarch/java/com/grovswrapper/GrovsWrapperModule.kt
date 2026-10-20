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
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import io.grovs.Grovs
import io.grovs.model.CustomLinkRedirect
import io.grovs.service.CustomRedirects
import io.grovs.service.TrackingParams
import io.grovs.model.events.PaymentEventType
import io.grovs.utils.InstantCompat
import io.grovs.utils.flow
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.io.Serializable


@ReactModule(name = GrovsWrapperModule.NAME)
class GrovsWrapperModule(reactContext: ReactApplicationContext) :
  NativeGrovsWrapperSpec(reactContext) {

    private var incomingDeeplinksJob: Job? = null

  init {
    GrovsInAppEvents.install()
    GrovsPush.fetchFirebaseToken()
  }

  private fun rejectIfDisabled(promise: Promise): Boolean {
    if (GrovsConsent.isEnabled(reactApplicationContext)) return false
    promise.reject(GrovsConsent.DISABLED_ERROR_CODE, GrovsConsent.DISABLED_ERROR_MESSAGE)
    return true
  }

  override fun getName(): String {
    return NAME
  }

  override fun setIdentifier(identifier: String?) {
    Grovs.identifier = identifier
  }

  override fun setPushToken(pushToken: String?) {
    Grovs.pushToken = pushToken
  }

  override fun setAttributes(attributes: ReadableMap?) {
    Grovs.attributes = attributes?.toMap()?.toSerializableMap()
  }

  override fun setSDK(enabled: Boolean) {
    GrovsConsent.setEnabled(reactApplicationContext, enabled)
    Grovs.setSDK(enabled = enabled)
    if (enabled) {
      // Retry a launch link that arrived while consent was disabled.
      Handler(Looper.getMainLooper()).post {
        if (GrovsConsent.isEnabled(reactApplicationContext)) {
          reactApplicationContext.currentActivity?.let { Grovs.onStart(launcherActivity = it) }
        }
      }
    }
  }

  override fun setDebug(level: String) {
    if (level == "info") {
      Grovs.setDebug(level = io.grovs.model.LogLevel.INFO)
    } else if (level == "error") {
      Grovs.setDebug(level = io.grovs.model.LogLevel.ERROR)
    }
  }

  override fun track(name: String, properties: ReadableMap?, tags: ReadableArray?) {
    Grovs.track(
      name = name,
      properties = properties?.toMap()?.toSerializableMap(),
      tags = tags?.toList()?.toStringList()
    )
  }

  override fun trackScreenView(screenName: String, properties: ReadableMap?) {
    Grovs.trackScreenView(
      screenName = screenName,
      properties = properties?.toMap()?.toSerializableMap()
    )
  }

  override fun setGlobalTags(tags: ReadableArray?) {
    Grovs.setGlobalTags(tags = tags?.toList()?.toStringList())
  }

  override fun setScreenAliases(aliases: ReadableMap) {
    val stringAliases = aliases.toMap()
      .mapNotNull { (key, value) -> (value as? String)?.let { key to it } }
      .toMap()
    Grovs.setScreenAliases(stringAliases)
  }

  override fun generateLink(title: String?,
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
                            promise: Promise) {
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

    var nativeCustomRedirectIos: CustomLinkRedirect? = null
    iosUrl?.let {
      nativeCustomRedirectIos = CustomLinkRedirect(link = iosUrl, openAppIfInstalled = iosOpenIfInstalled ?: true)
    }

    var nativeCustomRedirectAndroid: CustomLinkRedirect? = null
    androidUrl?.let {
      nativeCustomRedirectAndroid = CustomLinkRedirect(link = androidUrl, openAppIfInstalled = androidOpenIfInstalled ?: true)
    }

    var nativeCustomRedirectDesktop: CustomLinkRedirect? = null
    desktopUrl?.let {
      nativeCustomRedirectDesktop = CustomLinkRedirect(link = desktopUrl, openAppIfInstalled = desktopOpenIfInstalled ?: true)
    }

    val nativeCustomRedirect = CustomRedirects(ios = nativeCustomRedirectIos, android = nativeCustomRedirectAndroid, desktop = nativeCustomRedirectDesktop)

    val trackingParams = tracking?.toMap()?.toSerializableMap()
    val utmCampaign = trackingParams?.get("utm_campaign") as? String
    val utmSource = trackingParams?.get("utm_source") as? String
    val utmMedium = trackingParams?.get("utm_medium") as? String

    val nativeTracking = TrackingParams(
      utmCampaign = utmCampaign,
      utmSource = utmSource,
      utmMedium = utmMedium
    )

    Grovs.generateLink(title = title,
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
                          link?.let { link ->
                            promise.resolve(link)
                          } ?: run {
                            error?.let { error ->
                              promise.reject("Error", error.toString())
                            } ?: run {
                              promise.reject("Error", "Failed to generate link.")
                            }
                          }
                        })
  }

  override fun displayMessages(promise: Promise) {
    if (rejectIfDisabled(promise)) return
    Grovs.displayMessagesFragment {
      promise.resolve(null)
    }
  }

  override fun numberOfUnreadMessages(promise: Promise) {
    if (rejectIfDisabled(promise)) return
    Grovs.numberOfUnreadMessages(onResult = {
      it?.let {
        promise.resolve(it)
      } ?: run {
        promise.reject("Error", "Failed to fetch messages number.")
      }
    })
  }

  override fun logInAppPurchase(transactionId: String?, originalJson: String?, promise: Promise) {
    // transactionId is iOS-only; Android logs the Play Billing purchase JSON.
    if (originalJson == null) {
      promise.resolve(false)
      return
    }
    Grovs.logInAppPurchase(originalJson = originalJson)
    promise.resolve(true)
  }

  override fun logCustomPurchase(
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

  override fun pauseInAppMessages() {
    Grovs.pauseInAppMessages()
  }

  override fun resumeInAppMessages() {
    Grovs.resumeInAppMessages()
  }

  override fun discardInAppMessages(dismissCurrent: Boolean) {
    Grovs.discardInAppMessages(dismissCurrent)
  }

  override fun setInAppExcludedScreens(screens: ReadableArray) {
    Grovs.setInAppExcludedScreens(screens.toList().toStringList())
  }

  override fun setInAppDebugLogging(enabled: Boolean) {
    Grovs.setInAppDebugLogging(enabled)
  }

  private val emitInAppMessage: (WritableMap) -> Unit = { data ->
    if (reactApplicationContext.hasActiveReactInstance()) {
      try {
        reactApplicationContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit("onGrovsInAppMessage", data)
      } catch (_: RuntimeException) {
      }
    }
  }

  override fun markReadyForInAppEvents() {
    GrovsInAppEvents.markReady(emitInAppMessage)
  }

  override fun invalidate() {
    GrovsInAppEvents.detach(emitInAppMessage)
    super.invalidate()
  }

  override fun handleNotificationOpen(data: ReadableMap, promise: Promise) {
    promise.resolve(GrovsPush.handleNotificationOpen(data.toMap()))
  }

  override fun isGrovsNotification(data: ReadableMap, promise: Promise) {
    promise.resolve(GrovsPush.isGrovsNotification(data.toMap()))
  }

  override fun addListener(eventName: String?) {
    // Required for Turbo Module event emitters
    // This is called automatically when JS adds a listener
  }

  override fun removeListeners(count: Double) {
    // Required for Turbo Module event emitters
    // This is called automatically when JS adds a listener
  }

  override fun markReadyToHandleDeeplinks() {
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

            reactApplicationContext
              .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
              .emit("onGrovsDeeplinkReceived", writableMap)
            //emitOnDeeplinkReceived(writableMap)
          }
        }
      }
    }
  }

  companion object {
    const val NAME = "GrovsWrapper"
  }
}
