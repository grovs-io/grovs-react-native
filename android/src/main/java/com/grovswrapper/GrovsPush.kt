package com.grovswrapper

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.BaseActivityEventListener
import com.google.firebase.messaging.FirebaseMessaging
import io.grovs.Grovs
import java.util.Collections
import java.util.WeakHashMap

object GrovsPush : BaseActivityEventListener() {
  private const val CAMPAIGN_ID = "grovs_campaign_id"
  private const val FETCH_FIREBASE_TOKEN_META = "io.grovs.wrapper.FetchFirebaseToken"

  private val mainHandler = Handler(Looper.getMainLooper())

  /** Push intents Grovs.onStart / onNewIntent handled, each paired with at most one JS tap. */
  private val launcherTaps = Collections.newSetFromMap(WeakHashMap<Intent, Boolean>())
  private val pairedLauncherTaps = Collections.newSetFromMap(WeakHashMap<Intent, Boolean>())

  override fun onNewIntent(intent: Intent) {
    if (Grovs.isGrovsNotification(intent)) launcherTaps += intent
  }

  /**
   * Handles a tap reported from JS, unless the launcher intent already carried the same push.
   * Runs on the main thread, after the onNewIntent of the tap that JS is reporting.
   */
  fun handleNotificationOpen(data: Map<String, Any?>, activity: Activity?, completion: (Boolean) -> Unit) {
    val strings = data.toStringMap()
    if (!Grovs.isGrovsNotification(strings)) {
      completion(false)
      return
    }
    mainHandler.post {
      if (!pairWithLauncherTap(strings[CAMPAIGN_ID], activity?.intent)) {
        Grovs.handleNotificationOpen(Intent().apply { strings.forEach(::putExtra) })
      }
      completion(true)
    }
  }

  private fun pairWithLauncherTap(campaignId: String?, launchIntent: Intent?): Boolean {
    launchIntent?.takeIf { it !in pairedLauncherTaps && Grovs.isGrovsNotification(it) }?.let { launcherTaps += it }
    val match = launcherTaps.firstOrNull { it.getStringExtra(CAMPAIGN_ID) == campaignId } ?: return false
    launcherTaps -= match
    pairedLauncherTaps += match
    return true
  }

  fun isGrovsNotification(data: Map<String, Any?>): Boolean = Grovs.isGrovsNotification(data.toStringMap())

  private fun Map<String, Any?>.toStringMap(): Map<String, String> =
    mapNotNull { (key, value) -> value?.let { key to it.toString() } }.toMap()

  /** Sends the FCM token to Grovs only if the app opted in from its manifest and consent allows it. */
  fun fetchFirebaseToken(context: Context) {
    if (!isFirebaseTokenFetchEnabled(context) || !GrovsConsent.isEnabled(context)) return
    try {
      Class.forName("com.google.firebase.messaging.FirebaseMessaging")
      FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
        if (GrovsConsent.isEnabled(context)) Grovs.pushToken = token
      }
    } catch (_: ClassNotFoundException) {
    } catch (_: NoClassDefFoundError) {
    } catch (_: IllegalStateException) {
    }
  }

  private fun isFirebaseTokenFetchEnabled(context: Context): Boolean =
    try {
      context.packageManager
        .getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
        .metaData?.getBoolean(FETCH_FIREBASE_TOKEN_META, false) ?: false
    } catch (_: PackageManager.NameNotFoundException) {
      false
    }
}
