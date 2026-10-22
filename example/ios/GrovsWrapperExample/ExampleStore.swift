import Foundation
import React

/// Settings read by `Grovs.configure` at launch. Stored as JSON shared with the JS side.
struct Profile {
  var id: String
  var name: String
  var apiKey: String
  var test: Bool
  var baseUrl: String?
  var autoTrack = true
  var startEnabled = true
  var clipboardDomains: [String] = []

  static let `default` = Profile(
    id: "grovs-test",
    name: "Grovs test",
    apiKey: "grovst_06e36086dad3e934289560e3ca59527282030868f8c844629516c6e6c67bbf1f",
    test: true,
    baseUrl: nil
  )

  init(id: String, name: String, apiKey: String, test: Bool, baseUrl: String?) {
    self.id = id
    self.name = name
    self.apiKey = apiKey
    self.test = test
    self.baseUrl = baseUrl
  }

  init(json: [String: Any]) throws {
    guard let id = json["id"] as? String,
          let name = json["name"] as? String,
          let apiKey = json["apiKey"] as? String,
          let test = json["test"] as? Bool else {
      throw StoreError("A stored profile is missing id, name, apiKey or test")
    }
    self.init(id: id, name: name, apiKey: apiKey, test: test, baseUrl: json["baseUrl"] as? String)
    autoTrack = json["autoTrack"] as? Bool ?? true
    startEnabled = json["startEnabled"] as? Bool ?? true
    clipboardDomains = json["clipboardDomains"] as? [String] ?? []
  }

  var json: String {
    let object: [String: Any] = [
      "id": id,
      "name": name,
      "apiKey": apiKey,
      "test": test,
      "baseUrl": baseUrl ?? NSNull(),
      "autoTrack": autoTrack,
      "startEnabled": startEnabled,
      "clipboardDomains": clipboardDomains,
    ]
    let data = try? JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])
    return data.flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
  }
}

struct StoreError: LocalizedError {
  let errorDescription: String?

  init(_ message: String) {
    errorDescription = message
  }
}

@objc(ExampleStore)
final class ExampleStore: NSObject {
  static let profilesKey = "profiles"
  static let activeProfileIdKey = "activeProfileId"
  static let debugLevelKey = "debugLevel"
  static let pushTokenKey = "pushToken"

  static var startedProfile = Profile.default
  static var configureError: String?

  private static let keyPrefix = "example_store."
  private static let defaults = UserDefaults(suiteName: nil)!

  static func string(_ key: String) -> String? {
    defaults.string(forKey: keyPrefix + key)
  }

  static func setString(_ value: String?, forKey key: String) {
    defaults.set(value, forKey: keyPrefix + key)
  }

  /// The active stored profile, or the default when none is stored. Throws when the stored one is unusable.
  static func activeProfile() throws -> Profile {
    guard let json = string(profilesKey) else { return .default }
    guard let array = try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [[String: Any]] else {
      throw StoreError("Stored profiles are not a list")
    }
    let profiles = try array.map(Profile.init(json:))
    let activeId = string(activeProfileIdKey)
    guard let profile = profiles.first(where: { $0.id == activeId }) else {
      throw StoreError("Active profile \"\(activeId ?? "null")\" not found")
    }
    if profile.apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
      throw StoreError("\(profile.name) has no API key")
    }
    return profile
  }

  static func savePushToken(_ deviceToken: Data) {
    setString(deviceToken.map { String(format: "%02x", $0) }.joined(), forKey: pushTokenKey)
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc func constantsToExport() -> [AnyHashable: Any]! {
    [
      "startedProfile": Self.startedProfile.json,
      "configureError": Self.configureError ?? NSNull(),
    ]
  }

  @objc func getAll(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    var values: [String: String] = [:]
    for (key, value) in Self.defaults.dictionaryRepresentation() {
      if key.hasPrefix(Self.keyPrefix), let value = value as? String {
        values[String(key.dropFirst(Self.keyPrefix.count))] = value
      }
    }
    resolve(values)
  }

  @objc func set(_ key: String, value: String?) {
    Self.setString(value, forKey: key)
  }

  @objc func restart() {
    DispatchQueue.main.async {
      Self.defaults.synchronize()
      exit(0)
    }
  }

  @objc func fetchPushToken(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(Self.string(Self.pushTokenKey))
  }
}
