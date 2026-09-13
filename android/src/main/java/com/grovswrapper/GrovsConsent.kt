package com.grovswrapper

import android.content.Context

/** Stores consent so configure can restore it before React Native starts. */
object GrovsConsent {
  private const val PREFS_NAME = "grovs_wrapper"
  private const val KEY_SDK_ENABLED = "sdk_enabled"

  const val DISABLED_ERROR_CODE = "SDK_DISABLED"
  const val DISABLED_ERROR_MESSAGE = "Grovs SDK is disabled. Call setSDK(true) first."

  /** `true` when nothing has been stored yet. */
  @JvmStatic
  fun isEnabled(context: Context): Boolean =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getBoolean(KEY_SDK_ENABLED, true)

  /** Written synchronously so the value is on disk before the process can die. */
  @JvmStatic
  fun setEnabled(context: Context, enabled: Boolean) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(KEY_SDK_ENABLED, enabled)
      .commit()
  }
}
