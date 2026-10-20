package com.grovswrapper

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import java.io.Serializable

fun ReadableMap.toMap(): Map<String, Any?> {
  val result = mutableMapOf<String, Any?>()
  val iterator = this.entryIterator

  while (iterator.hasNext()) {
    val entry = iterator.next()
    result[entry.key] = when (val value = entry.value) {
      is ReadableMap -> value.toMap()
      is ReadableArray -> value.toList()
      else -> value
    }
  }

  return result
}

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
    if (value is Serializable) key to value else null
  }.toMap()
}

fun List<Any?>.toStringList(): List<String> {
  return this.mapNotNull { it?.toString() }
}

fun Map<String, Any?>.toWritableMap(): WritableMap {
  val writableMap = Arguments.createMap()

  for ((key, value) in this) {
    when (value) {
      is String -> writableMap.putString(key, value)
      is Int -> writableMap.putInt(key, value)
      is Long -> writableMap.putDouble(key, value.toDouble())
      is Float -> writableMap.putDouble(key, value.toDouble())
      is Double -> writableMap.putDouble(key, value)
      is Boolean -> writableMap.putBoolean(key, value)
      is Map<*, *> -> (value as? Map<String, Any?>)?.let { writableMap.putMap(key, it.toWritableMap()) }
      is List<*> -> writableMap.putArray(key, value.toWritableArray())
      else -> writableMap.putNull(key)
    }
  }

  return writableMap
}

fun List<*>.toWritableArray(): WritableArray {
  val writableArray = Arguments.createArray()

  for (value in this) {
    when (value) {
      is String -> writableArray.pushString(value)
      is Int -> writableArray.pushInt(value)
      is Long -> writableArray.pushDouble(value.toDouble())
      is Float -> writableArray.pushDouble(value.toDouble())
      is Double -> writableArray.pushDouble(value)
      is Boolean -> writableArray.pushBoolean(value)
      is Map<*, *> -> (value as? Map<String, Any?>)?.let { writableArray.pushMap(it.toWritableMap()) }
      is List<*> -> writableArray.pushArray(value.toWritableArray())
      else -> writableArray.pushNull()
    }
  }

  return writableArray
}
