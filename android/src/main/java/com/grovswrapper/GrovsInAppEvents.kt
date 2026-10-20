package com.grovswrapper

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import io.grovs.Grovs
import io.grovs.GrovsInAppListener

object GrovsInAppEvents : GrovsInAppListener {
  private const val BUFFER_LIMIT = 20

  private val lock = Any()
  private val buffer = ArrayDeque<WritableMap>()
  private var emitter: ((WritableMap) -> Unit)? = null
  private var installed = false

  fun install() {
    synchronized(lock) {
      if (installed) return
      installed = true
    }
    Grovs.setInAppListener(this)
  }

  /** Flushes buffered events in order, then emits directly. A later call only replaces the emitter. */
  fun markReady(emit: (WritableMap) -> Unit) {
    val pending: List<WritableMap>
    synchronized(lock) {
      emitter = emit
      pending = buffer.toList()
      buffer.clear()
    }
    pending.forEach(emit)
  }

  /** Buffers events again until the next markReady. Ignored if another emitter took over. */
  fun detach(emit: (WritableMap) -> Unit) {
    synchronized(lock) {
      if (emitter === emit) emitter = null
    }
  }

  private fun dispatch(event: WritableMap) {
    val target = synchronized(lock) {
      emitter ?: run {
        if (buffer.size >= BUFFER_LIMIT) buffer.removeFirst()
        buffer.addLast(event)
        null
      }
    }
    target?.invoke(event)
  }

  private fun event(type: String, campaignId: String, fill: WritableMap.() -> Unit = {}): WritableMap =
    Arguments.createMap().apply {
      putString("type", type)
      putString("campaignId", campaignId)
      fill()
    }

  override fun onInAppMessageShown(campaignId: String) {
    dispatch(event("shown", campaignId))
  }

  override fun onInAppMessageClicked(campaignId: String, buttonId: String?, payload: Map<String, Any?>?) {
    dispatch(event("clicked", campaignId) {
      buttonId?.let { putString("buttonId", it) }
      payload?.let { putMap("payload", it.toWritableMap()) }
    })
  }

  override fun onInAppMessageDismissed(campaignId: String, reason: String) {
    dispatch(event("dismissed", campaignId) { putString("reason", reason) })
  }

  override fun onInAppMessageAnswered(campaignId: String, value: Any, comment: String?) {
    dispatch(event("answered", campaignId) {
      when (value) {
        is Int -> putInt("value", value)
        else -> putString("value", value.toString())
      }
      comment?.let { putString("comment", it) }
    })
  }

  override fun onInAppMessageFailed(campaignId: String, message: String) {
    dispatch(event("failed", campaignId) { putString("message", message) })
  }
}
