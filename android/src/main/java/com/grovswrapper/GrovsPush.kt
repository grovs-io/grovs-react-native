package com.grovswrapper

import com.google.firebase.messaging.FirebaseMessaging
import io.grovs.Grovs

object GrovsPush {
  fun handleNotificationOpen(data: Map<String, Any?>): Boolean {
    // Taps are handled from the launcher intent; the JS data only needs classifying.
    return isGrovsNotification(data)
  }

  fun isGrovsNotification(data: Map<String, Any?>): Boolean {
    val strings = data.mapNotNull { (key, value) -> value?.let { key to it.toString() } }.toMap()
    return Grovs.isGrovsNotification(strings)
  }

  fun fetchFirebaseToken() {
    try {
      Class.forName("com.google.firebase.messaging.FirebaseMessaging")
      FirebaseMessaging.getInstance().token.addOnSuccessListener { Grovs.pushToken = it }
    } catch (_: ClassNotFoundException) {
    } catch (_: NoClassDefFoundError) {
    } catch (_: IllegalStateException) {
    }
  }
}
