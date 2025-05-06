package com.grovswrapper

import java.io.Serializable;
import android.app.Activity;

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import io.grovs.Grovs;
import io.grovs.model.CustomLinkRedirect
import io.grovs.service.CustomRedirects

fun ReadableMap.toMap(): Map<String, Any?> {
    val result = mutableMapOf<String, Any?>()
    val iterator = this.entryIterator

    while (iterator.hasNext()) {
        val entry = iterator.next()
        result[entry.key] = when (val value = entry.value) {
            is ReadableMap -> value.toMap() // Recursively convert nested objects
            is ReadableArray -> value.toList() // Convert arrays
            else -> value // Directly use other values
        }
    }

    return result
}

// Helper function for ReadableArray
fun ReadableArray.toList(): List<Any?> {
    val result = mutableListOf<Any?>()
    for (i in 0 until this.size()) {
        result.add(
            when (this.getType(i)) {
                ReadableType.Map -> this.getMap(i)?.toMap()
                ReadableType.Array -> this.getArray(i)?.toList()
                ReadableType.String -> this.getString(i)
                ReadableType.Number -> this.getDouble(i)
                ReadableType.Boolean -> this.getBoolean(i)
                else -> null
            }
        )
    }
    return result
}

fun Map<String, Any?>.toSerializableMap(): Map<String, Serializable> {
    return this.mapNotNull { (key, value) ->
        if (value is Serializable) key to value else null // Only keep serializable values
    }.toMap()
}

fun List<Any?>.toStringList(): List<String> {
    return this.mapNotNull { it?.toString() } // Converts all non-null elements to String
}

fun Map<String, Any?>.toWritableMap(): WritableMap {
    val writableMap = Arguments.createMap()

    for ((key, value) in this) {
        when (value) {
            is String -> writableMap.putString(key, value)
            is Int -> writableMap.putInt(key, value)
            is Double -> writableMap.putDouble(key, value)
            is Boolean -> writableMap.putBoolean(key, value)
            is Map<*, *> -> (value as? Map<String, Any?>)?.let { writableMap.putMap(key, it.toWritableMap()) }
            is List<*> -> writableMap.putArray(key, value.toWritableArray())
            else -> writableMap.putNull(key) // Unsupported types will be set to null
        }
    }

    return writableMap
}

// Helper function: Convert List to WritableArray
fun List<*>.toWritableArray(): WritableArray {
    val writableArray = Arguments.createArray()

    for (value in this) {
        when (value) {
            is String -> writableArray.pushString(value)
            is Int -> writableArray.pushInt(value)
            is Double -> writableArray.pushDouble(value)
            is Boolean -> writableArray.pushBoolean(value)
            is Map<*, *> -> (value as? Map<String, Any?>)?.let { writableArray.pushMap(it.toWritableMap()) }
            is List<*> -> writableArray.pushArray(value.toWritableArray())
            else -> writableArray.pushNull()
        }
    }

    return writableArray
}

@ReactModule(name = GrovsWrapperModule.NAME)
class GrovsWrapperModule(reactContext: ReactApplicationContext) :
  NativeGrovsWrapperSpec(reactContext) {

  init {
    val activity: Activity? = reactApplicationContext.currentActivity
    activity?.let { activity ->
      Grovs.setOnDeeplinkReceivedListener(activity) { link, payload ->
        val writableMap = Arguments.createMap()
        writableMap.putString("grovs_link", link)
        payload?.let { writableMap.putMap("data", it.toWritableMap()) }

        emitOnDeeplinkReceived(writableMap)
      }
    }
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

  override fun setSDK(enabled: Boolean){
    Grovs.setSDK(enabled = enabled)
  }

  override fun setDebug(level: String) {
    if (level == "info") {
      Grovs.setDebug(level = io.grovs.model.LogLevel.INFO)
    } else if (level == "error") {
      Grovs.setDebug(level = io.grovs.model.LogLevel.ERROR)
    }
  }

  override fun generateLink(title: String?,
                            subtitle: String?,
                            imageURL: String?,
                            data: ReadableMap?,
                            tags: ReadableArray?,
                            customRedirects: ReadableMap?,
                            showPreview: Boolean?,
                            promise: Promise) {

    val redirects = customRedirects?.toMap()?.toSerializableMap()
    val ios = redirects?.get("ios") as? Map<*, *>
    val iosUrl = ios?.get("link") as? String
    val iosOpenIfInstalled = ios?.get("open_if_app_installed") as? Boolean

    val android = redirects?.get("android") as? Map<*, *>
    val androidUrl = android?.get("link") as? String
    val androidOpenIfInstalled = android?.get("open_if_app_installed") as? Boolean

    val desktop = redirects?.get("desktop") as? Map<*, *>
    val desktopUrl = desktop?.get("link") as? String

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
      nativeCustomRedirectDesktop = CustomLinkRedirect(link = desktopUrl, openAppIfInstalled = iosOpenIfInstalled ?: true)
    }

    val nativeCustomRedirect = CustomRedirects(ios = nativeCustomRedirectIos, android = nativeCustomRedirectAndroid, desktop = nativeCustomRedirectDesktop)

    Grovs.generateLink(title = title,
                        subtitle = subtitle,
                        imageURL = imageURL,
                        data = data?.toMap()?.toSerializableMap(),
                        tags = tags?.toList()?.toStringList(),
                        lifecycleOwner = null,
                        customRedirects = nativeCustomRedirect,
                        showPreview = showPreview,
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
    Grovs.displayMessagesFragment {
      promise.resolve(null)
    }
  }

  override fun numberOfUnreadMessages(promise: Promise) {
    Grovs.numberOfUnreadMessages(onResult = {
      it?.let {
        promise.resolve(it)
      } ?: run {
        promise.reject("Error", "Failed to fetch messages number.")
      }
    })
  }

  companion object {
    const val NAME = "GrovsWrapper"
  }
}
