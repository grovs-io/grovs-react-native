package grovswrapper.example

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.firebase.messaging.FirebaseMessaging
import com.jakewharton.processphoenix.ProcessPhoenix
import org.json.JSONArray
import org.json.JSONObject

/** Settings read by `Grovs.configure` at launch. Stored as JSON shared with the JS side. */
data class Profile(
  val id: String,
  val name: String,
  val apiKey: String,
  val test: Boolean,
  val baseUrl: String?,
  val autoTrack: Boolean = true,
  val startEnabled: Boolean = true,
  val clipboardDomains: List<String> = emptyList(),
) {
  fun toJson(): String = JSONObject()
    .put("id", id)
    .put("name", name)
    .put("apiKey", apiKey)
    .put("test", test)
    .put("baseUrl", baseUrl ?: JSONObject.NULL)
    .put("autoTrack", autoTrack)
    .put("startEnabled", startEnabled)
    .put("clipboardDomains", JSONArray(clipboardDomains))
    .toString()

  companion object {
    val DEFAULT = Profile(
      id = "grovs-test",
      name = "Grovs test",
      apiKey = "grovst_06e36086dad3e934289560e3ca59527282030868f8c844629516c6e6c67bbf1f",
      test = true,
      baseUrl = null,
      autoTrack = false,
    )

    fun fromJson(o: JSONObject): Profile {
      val domains = o.optJSONArray("clipboardDomains")
      return Profile(
        id = o.getString("id"),
        name = o.getString("name"),
        apiKey = o.getString("apiKey"),
        test = o.getBoolean("test"),
        baseUrl = if (o.isNull("baseUrl")) null else o.getString("baseUrl"),
        autoTrack = o.optBoolean("autoTrack", true),
        startEnabled = o.optBoolean("startEnabled", true),
        clipboardDomains = if (domains == null) emptyList() else (0 until domains.length()).map(domains::getString),
      )
    }
  }
}

object ExampleStore {
  const val KEY_PROFILES = "profiles"
  const val KEY_ACTIVE_PROFILE_ID = "activeProfileId"
  const val KEY_DEBUG_LEVEL = "debugLevel"

  var startedProfile: Profile = Profile.DEFAULT
  var configureError: String? = null

  fun prefs(context: Context): SharedPreferences =
    context.getSharedPreferences("example_store", Context.MODE_PRIVATE)

  /** The active stored profile, or the default when none is stored. Throws when the stored one is unusable. */
  fun activeProfile(prefs: SharedPreferences): Profile {
    val json = prefs.getString(KEY_PROFILES, null) ?: return Profile.DEFAULT
    val array = JSONArray(json)
    val profiles = (0 until array.length()).map { Profile.fromJson(array.getJSONObject(it)) }
    val activeId = prefs.getString(KEY_ACTIVE_PROFILE_ID, null)
    val profile = profiles.firstOrNull { it.id == activeId }
      ?: throw IllegalStateException("Active profile \"$activeId\" not found")
    if (profile.apiKey.isBlank()) throw IllegalStateException("${profile.name} has no API key")
    return profile
  }
}

class ExampleStoreModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val prefs = ExampleStore.prefs(context)

  override fun getName(): String = "ExampleStore"

  override fun getConstants(): Map<String, Any?> = mapOf(
    "startedProfile" to ExampleStore.startedProfile.toJson(),
    "defaultProfile" to Profile.DEFAULT.toJson(),
    "configureError" to ExampleStore.configureError,
  )

  @ReactMethod
  fun getAll(promise: Promise) {
    val map = Arguments.createMap()
    prefs.all.forEach { (key, value) -> if (value is String) map.putString(key, value) }
    promise.resolve(map)
  }

  @ReactMethod
  fun set(key: String, value: String?) {
    val editor = prefs.edit()
    if (value == null) editor.remove(key) else editor.putString(key, value)
    editor.apply()
  }

  @ReactMethod
  fun restart() {
    // Writes pending from apply() must reach disk before the process dies.
    prefs.edit().commit()
    ProcessPhoenix.triggerRebirth(reactApplicationContext)
  }

  @ReactMethod
  fun fetchPushToken(promise: Promise) {
    try {
      FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
        if (task.isSuccessful) {
          promise.resolve(task.result?.takeIf { it.isNotEmpty() })
        } else {
          promise.reject("push_token", task.exception?.message ?: "Could not get the push token", task.exception)
        }
      }
    } catch (e: IllegalStateException) {
      promise.reject("push_token", "Firebase is not set up, add android/app/google-services.json", e)
    }
  }
}
