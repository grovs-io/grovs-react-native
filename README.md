<p align="center">
  <a href="https://grovs.io">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://s3.eu-north-1.amazonaws.com/grovs.io/full-white.svg">
      <img src="https://s3.eu-north-1.amazonaws.com/grovs.io/full-black.svg" width="120" alt="Grovs">
    </picture>
  </a>
</p>

<p align="center">
  Deep linking, attribution, and smart links for React Native.<br/>
  Part of the <a href="https://github.com/grovs-io">Grovs</a> open-source mobile linking platform.
</p>

<p align="center">
  <a href="https://docs.grovs.io/docs/sdk/react-native/quick-start">Quick Start</a> ·
  <a href="https://docs.grovs.io/docs/sdk/react-native/api-reference">API Reference</a> ·
  <a href="https://docs.grovs.io">Full Docs</a>
</p>

---

The Grovs React Native SDK provides deep linking, universal links, app links, link generation, in-app messaging, revenue tracking, and attribution for your React Native apps.

## Features

- **Deep linking & universal links**: route users to the right in-app screen, even after install
- **Clipboard deferred deep linking**: match an install to a link the user copied before installing
- **Consent support**: remember the user’s choice across launches
- **Smart link generation**: create trackable links with metadata, custom redirects, and UTM parameters
- **In-app messaging**: messages from the Grovs dashboard, with pause, resume, excluded screens and events
- **Push notifications**: receive push campaigns, with tap tracking and iOS rich push
- **Revenue tracking**: log App Store, Google Play, and custom purchases with automatic attribution
- **Analytics**: automatic lifecycle events, custom events, and screen tracking
- **User identity**: attach user IDs and attributes for analytics and segmentation
- **Self-hosting support**: point the SDK at your own backend
- **Expo support**: config plugin for automated native setup

## Requirements

- React Native 0.70+
- iOS 13.0+
- Android API 21+ (Android 5.0)

These are the minimums of the native Grovs SDKs. Your React Native version may require a higher one.

The wrapper uses these Grovs native SDKs:

- **iOS**: `Grovs` 3.1 from CocoaPods
- **Android**: `io.grovs:Grovs:3.1.0` from Maven Central

## Installation

```bash
# Using npm
npm install react-native-grovs-wrapper

# Using yarn
yarn add react-native-grovs-wrapper
```

### Android dependency

Your app calls `Grovs` directly from `MainApplication` and `MainActivity`, so add the Grovs Android SDK to `android/app/build.gradle`:

```groovy
dependencies {
    implementation 'io.grovs:Grovs:3.1.0'
}
```

It is published on Maven Central, so no extra repository is needed. The Expo config plugin adds this line for you.

### iOS dependency

The iOS SDK is added automatically via CocoaPods when you run `pod install`. After upgrading the wrapper, run `pod install` again.

## Expo Integration

If you're using Expo with a development build, the config plugin automates all native setup. Add to your `app.json`:

```json
{
  "plugins": [
    ["react-native-grovs-wrapper", {
      "apiKey": "your-api-key",
      "scheme": "your_app_scheme",
      "useTestEnvironment": false,
      "associatedDomains": ["your_app_host", "your_app_test_host"],
      "baseURL": "https://your-domain.com",
      "clipboardDomains": ["links.your-domain.com"]
    }]
  ]
}
```

| Property | Required | Description |
|---|---|---|
| `apiKey` | Yes | Your Grovs API key |
| `scheme` | Yes | Custom URL scheme for deep links |
| `useTestEnvironment` | No | Use test environment (default: `false`) |
| `associatedDomains` | No | Universal link domains for deep linking |
| `baseURL` | No | Custom base URL for self-hosted backends |
| `clipboardDomains` | No | Extra link hosts accepted for clipboard deferred deep linking. Grovs hosts are always accepted |
| `push` | No | Set up push (see below). Default `false` |
| `iosRichPush` | No | Create the iOS Notification Service Extension for images in pushes. Needs `push`. Needs `ios.bundleIdentifier` |
| `appleTeamId` | No | Apple team id used to sign the extension. The plugin does not read `ios.appleTeamId`, so set it here |
| `androidNotificationIcon` | No | Name of a drawable used as the small notification icon |

#### Push with Expo

Set `"push": true` to add the native push setup:

- **iOS:** adds the `aps-environment` entitlement (`development` if missing), `didRegisterForRemoteNotificationsWithDeviceToken` calling `Grovs.setPushToken(deviceToken:)`, and a `userNotificationCenter(_:didReceive:...)` method calling `Grovs.handleNotificationResponse`. That method only runs if your app makes `AppDelegate` the notification center delegate. The plugin never sets the delegate. If a push library owns it, use `handleNotificationOpen` instead (see [Push notifications](#push-notifications)) and wire only one path.
- **Android:** adds `firebase-messaging` (skipped if `@react-native-firebase/messaging` is installed) and `POST_NOTIFICATIONS`. If `@react-native-firebase/messaging` or `expo-notifications` is installed, it removes the Grovs `MessagingService`. Firebase config comes from Expo's `android.googleServicesFile`.

`"iosRichPush": true` creates the `GrovsNotificationService` extension target with bundle id `<app bundle id>.GrovsNotificationService` and adds the EAS `appExtensions` entry.

```json
{
  "expo": {
    "android": { "googleServicesFile": "./google-services.json" },
    "plugins": [
      ["react-native-grovs-wrapper", {
        "apiKey": "your-api-key",
        "scheme": "your_app_scheme",
        "push": true,
        "iosRichPush": true,
        "appleTeamId": "ABCDE12345",
        "androidNotificationIcon": "ic_notification"
      }]
    ]
  }
}
```

The extension's Podfile block follows the stock Expo `use_frameworks!` setup, including `expo-build-properties` `useFrameworks`. If another plugin forces a different linkage, align it. With EAS remote versioning, check that the extension's build number matches the app's.

Tested with Expo SDK 58.

Then run `npx expo prebuild` and build with `npx expo run:ios` / `npx expo run:android`.

When upgrading an existing Expo integration or changing plugin options, regenerate with `npx expo prebuild --clean` to refresh the configure calls. Save any manual native edits first.

> **Note:** This requires a development build (`expo-dev-client`), not Expo Go.

## Manual Configuration

### Android

**1. Initialize the SDK** in your `MainApplication` class:

```kotlin
import com.grovswrapper.GrovsConsent
import io.grovs.Grovs

override fun onCreate() {
    super.onCreate()
    Grovs.configure(
        this, "your-api-key",
        useTestEnvironment = false,
        baseURL = null,                       // or "https://your-domain.com" for self-hosted backends
        autoTrackScreenViews = false,
        clipboardDomains = null,              // or listOf("links.your-domain.com")
        enabled = GrovsConsent.isEnabled(this) // the value JS last passed to setSDK, default true
    )
}
```

**2. Handle incoming links** in your `MainActivity`:

```kotlin
import android.content.Intent
import io.grovs.Grovs

override fun onStart() {
    super.onStart()
    Grovs.onStart(launcherActivity = this)
}

override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    Grovs.onNewIntent(intent, launcherActivity = this)
}
```

**3. Add intent filters** to your launcher activity in `AndroidManifest.xml`:

```xml
<!-- Custom URL scheme -->
<intent-filter>
    <data android:scheme="your_app_scheme" android:host="open" />
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
</intent-filter>

<!-- App links (production) -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="your_app_host" />
</intent-filter>

<!-- App links (test) -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="your_app_test_host" />
</intent-filter>
```

### iOS

**1. Initialize the SDK** in `AppDelegate.swift`:

```swift
import Grovs
import react_native_grovs_wrapper

func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    Grovs.configure(
        APIKey: "your-api-key",
        useTestEnvironment: false,
        // baseURL: "https://your-domain.com",      // self-hosted backends
        autoTrackScreenViews: false,
        // clipboardDomains: ["links.your-domain.com"],
        enabled: GrovsWrapperSwift.isSDKEnabled(), // the value JS last passed to setSDK, default true
        delegate: GrovsWrapperSwift.shared
    )
    Grovs.setDebug(level: .info)
    return true
}
```

**2. Handle incoming links** in `AppDelegate.swift`:

```swift
func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    return Grovs.handleAppDelegate(continue: userActivity, restorationHandler: restorationHandler)
}

func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    return Grovs.handleAppDelegate(open: url, options: options)
}
```

**3. Configure Associated Domains** in Xcode:

1. Select your app target → **Signing & Capabilities**
2. Add **Associated Domains** capability
3. Add `applinks:your_app_host` and `applinks:your_app_test_host`

**4. Configure URL scheme:**

1. In Xcode, select your target → **Info** tab
2. Under **URL Types**, click **+** and add the URL scheme from your Grovs dashboard

## Usage

### Handle deep links

```typescript
import Grovs from 'react-native-grovs-wrapper';

const listener = Grovs.onDeeplinkReceived((response) => {
    console.log('Link:', response.link);
    console.log('Data:', response.data);

    // Route the user based on payload
    if (response.data?.screen === 'product') {
        navigation.navigate('Product', { id: response.data.productId });
    }
});

// When you no longer need the listener
listener.remove();
```

### Set user identity

```typescript
Grovs.setIdentifier('user-123');
Grovs.setAttributes({
    name: 'John Doe',
    plan: 'premium',
});
```

### Consent

Call `setSDK(false)` when the user declines analytics and `setSDK(true)` when they accept. The wrapper remembers the last value, and the native `configure` call reads it on the next launch, so a user who declined stays opted out from the first frame of the next cold start.

While disabled, the SDK blocks new authentication, event and purchase requests and cancels work in progress. Identifier, attributes, push token and screen aliases you set are kept and sent once the SDK is enabled again. On Android, a link opened while disabled is delivered as soon as you enable the SDK.

```typescript
Grovs.setSDK(await consentStore.hasAnalyticsConsent());
```

`generateLink`, `numberOfUnreadMessages` and `displayMessages` reject with code `SDK_DISABLED` while the SDK is disabled.

### Clipboard deferred deep linking

If a user copies a Grovs link before installing, the SDK checks the clipboard once on first launch, only when fingerprint matching found nothing, and delivers the match through `onDeeplinkReceived`. It can arrive several seconds after launch. On iOS the system shows its paste notice the first time. Only links on Grovs hosts and the `clipboardDomains` you configure are accepted.

## Link Generation

Create smart links with metadata, payload data, and tracking parameters:

```typescript
try {
    const link = await Grovs.generateLink({
        title: 'Check out this product',
        subtitle: 'Limited time offer',
        imageURL: 'https://example.com/image.jpg',
        data: { productId: '12345', screen: 'product_detail' },
        tags: ['promotion', 'share'],
        customRedirects: {
            android: { link: 'https://example.com/android', open_if_app_installed: true },
            ios: { link: 'https://example.com/ios', open_if_app_installed: true },
            desktop: { link: 'https://example.com/desktop', open_if_app_installed: false },
        },
        showPreviewIos: false,
        showPreviewAndroid: false,
        tracking: { utm_campaign: 'spring_sale', utm_source: 'in_app', utm_medium: 'share_button' },
        copyToClipboardIos: true,      // landing page copies the link so the install can be matched
        copyToClipboardAndroid: true,  // leave undefined to inherit the project default
    });
    console.log('Generated:', link);
} catch (error) {
    console.error('Error:', error);
}
```

The older positional form `generateLink(title, subtitle, imageURL, data, tags, customRedirects, showPreviewIos, showPreviewAndroid, tracking, copyToClipboardIos, copyToClipboardAndroid)` still works.

Leave the copy flags undefined to inherit the project default.

## Messages

> If console messages have **automatic display** enabled in your dashboard, they will appear in your app without any additional integration.

### Push notifications

Push is opt-in. Upload your APNs key (`.p8`) and Firebase credentials in the [Grovs dashboard](https://app.grovs.io). The Expo config plugin can do the native setup for you, see the `push` options in [Expo Integration](#expo-integration).

A push with a Grovs link is delivered through `onDeeplinkReceived`, like any other link. A push without a link still arrives there, with `link` empty.

#### iOS

**1. Add the capabilities.** In Xcode, add **Push Notifications** and **Background Modes** (Remote notifications) to your app target. Your app asks for permission and calls `registerForRemoteNotifications()` itself.

**2. Send the token.** Either forward it from `AppDelegate.swift`:

```swift
func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Grovs.setPushToken(deviceToken: deviceToken)
}
```

or, if you use `@react-native-firebase/messaging`, pass the APNs token from JS:

```typescript
import messaging from '@react-native-firebase/messaging';

const token = await messaging().getAPNSToken();
if (token) {
    Grovs.setPushToken(token);
}
```

**3. Handle taps.** Wire exactly one of these paths. Wiring both counts every tap twice on iOS.

- **Native path.** If `AppDelegate` is your notification center delegate, forward the response:

  ```swift
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
      Grovs.handleNotificationResponse(response)
      completionHandler()
  }
  ```

- **JS path.** If a push library owns the delegate, call `handleNotificationOpen` from its tap listeners. It resolves `true` when the push is a Grovs push. Call it on taps only, never when a push is delivered.

  ```typescript
  // @react-native-firebase/messaging
  messaging().onNotificationOpenedApp((message) => {
      Grovs.handleNotificationOpen(message.data ?? {});
  });
  const initial = await messaging().getInitialNotification();
  if (initial) {
      Grovs.handleNotificationOpen(initial.data ?? {});
  }

  // expo-notifications
  Notifications.addNotificationResponseReceivedListener((response) => {
      Grovs.handleNotificationOpen(response.notification.request.content.data);
  });
  const last = await Notifications.getLastNotificationResponseAsync();
  if (last) {
      Grovs.handleNotificationOpen(last.notification.request.content.data);
  }
  ```

`isGrovsNotification(data)` resolves `true` if the payload came from Grovs, without handling it.

**4. Rich push (optional).** To show images in pushes, add a Notification Service Extension target in Xcode (**File > New > Target > Notification Service Extension**). Then add it to your `Podfile`:

```ruby
target 'GrovsNotificationService' do
  pod 'GrovsNotificationService', '~> 3.1'
end
```

and make the extension class a subclass:

```swift
import GrovsNotificationService

class NotificationService: GrovsNotificationServiceExtension {}
```

Run `pod install` again after this.

#### Android

**1. Add Firebase.** Add your `google-services.json`, the Google Services Gradle plugin and the Firebase Messaging dependency to your app. For Android 13+, declare the permission in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

Your app asks the user for this permission at runtime.

**2. Token.** When `firebase-messaging` is in your app, the wrapper fetches the first FCM token for you. Later tokens are handled by the SDK. If you use `@react-native-firebase/messaging` you can still pass it yourself:

```typescript
const token = await messaging().getToken();
if (token) {
    Grovs.setPushToken(token);
}
```

**3. Taps.** Taps are handled from the launcher intent, through the `Grovs.onStart` and `Grovs.onNewIntent` calls you already have in `MainActivity`. You do not need to call anything else. If you call `handleNotificationOpen` on Android, it only reports whether the push is a Grovs push and does not handle it a second time.

**4. Notification icon (optional).** Set a small icon in `AndroidManifest.xml`, inside `<application>`:

```xml
<meta-data android:name="io.grovs.NotificationIconSmall" android:resource="@drawable/ic_notification" />
```

**Using another push library.** Only one service can receive Firebase messages. If your app uses `@react-native-firebase/messaging` or `expo-notifications`, remove the Grovs service so that library keeps working. Add `xmlns:tools="http://schemas.android.com/tools"` to `<manifest>`, then inside `<application>`:

```xml
<service android:name="io.grovs.handlers.MessagingService" tools:node="remove" />
```

Taps and background pushes still work. What you lose is Grovs drawing pushes while the app is open; your push library handles that.

**Your own messaging service.** If your app has its own `FirebaseMessagingService`, remove the Grovs service as above and forward to Grovs:

```kotlin
import io.grovs.GrovsMessaging

override fun onMessageReceived(message: RemoteMessage) {
    GrovsMessaging.handleMessage(this, message)
}

override fun onNewToken(token: String) {
    GrovsMessaging.onNewToken(token)
}
```

### In-app messages

In-app messages created in the dashboard are shown by the native SDK. From JS you can control them and listen to what happens:

```typescript
// Hold messages back, for example during onboarding
Grovs.pauseInAppMessages();
Grovs.resumeInAppMessages();

// Drop queued messages. Pass dismissCurrent to close the one on screen too
Grovs.discardInAppMessages({ dismissCurrent: true });

// Never show messages on these screens (names as sent to trackScreenView)
Grovs.setInAppExcludedScreens(['Checkout', 'Onboarding']);

Grovs.setInAppDebugLogging(true);

const subscription = Grovs.onInAppMessage((event) => {
    if (event.type === 'clicked') {
        console.log(event.campaignId, event.buttonId, event.payload);
    }
});
subscription.remove();
```

Excluded screens match the names you send through `trackScreenView` or `startScreenTracking`, after aliases are applied.

`onInAppMessage` events:

| `type` | Fields | When |
|---|---|---|
| `shown` | `campaignId` | A message appeared |
| `clicked` | `campaignId`, `buttonId?`, `payload?` | The user tapped a button |
| `dismissed` | `campaignId`, `reason` | The message was closed. `reason` is `close_button`, `backdrop`, `swipe`, `app` or `orientation` |
| `answered` | `campaignId`, `value`, `comment?` | The user answered a question. `value` is the stars (number) or the option id (string) |
| `failed` | `message`, `campaignId?` | The message could not be shown |

Events that happen before your first `onInAppMessage` call (for example a message shown on app open) are kept, up to 20, and delivered when you subscribe.

There is no way to veto a message from JS. Use pause, resume, discard and excluded screens instead.

Test messages from the dashboard need `setIdentifier` to be set.

On Android you can optionally add the Google Play review dependency so review prompts can be shown:

```groovy
implementation 'com.google.android.play:review-ktx:2.0.2'
```

The push permission button in an in-app message on Android needs `POST_NOTIFICATIONS` declared in your manifest.

### Display messages (deprecated)

The message inbox is deprecated and does nothing in native 3.1. The methods still resolve, and `numberOfUnreadMessages()` resolves `0`.

```typescript
await Grovs.displayMessages();
const count = await Grovs.numberOfUnreadMessages();
```

## Revenue Tracking

> Revenue tracking is currently in **beta**.

### Setup

1. Enable revenue tracking in the [Grovs dashboard](https://app.grovs.io) under **Settings → Revenue Tracking**
2. Configure platform notifications:
   - **Android**: Set up Google Play Real-Time Developer Notifications
   - **iOS**: Configure App Store Server Notifications in App Store Connect

### Platform store purchases

```typescript
// iOS: StoreKit 2 transaction id
const success = await Grovs.logInAppPurchase({ transactionId: '123456789' });

// Android: Play Billing purchase original JSON
const success = await Grovs.logInAppPurchase({
  originalJson: purchase.originalJson,
});
```

> The SDK automatically extracts price, currency, and product info. Duplicates are filtered.

### Custom purchases

```typescript
const success = await Grovs.logCustomPurchase(
    'buy',              // type: 'buy' | 'cancel' | 'refund'
    999,                // priceInCents: $9.99
    'USD',              // currency code
    'premium_monthly',  // product identifier
);
```

Use `'cancel'` and `'refund'` types for cancellations and refunds. For store purchases, these are detected automatically via platform server notifications.

## Analytics

### Automatic events

The native SDKs automatically capture lifecycle events: `install`, `reinstall`, `app_open`, `reactivation`, and `time_spent`. No setup required.

### Custom events

```tsx
Grovs.track('purchase', { item_id: 'sku-42', price: 19.99 }, ['promo']);
```

Event names must not be empty or use a reserved system name (`view`, `open`, `install`, `reinstall`, `app_open`, `time_spent`, `reactivation`, `user_referred`, `custom`, `screen_view`). Properties are dropped if they serialize to more than 8KB, and tags are capped at 20 (255 characters each).

### Global tags

Attach tags to every subsequently tracked event:

```tsx
Grovs.setGlobalTags(['beta']);

// Clear global tags
Grovs.setGlobalTags();
```

### Screen tracking

With React Navigation, one line enables automatic screen view tracking:

```tsx
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import Grovs from 'react-native-grovs-wrapper';

function App() {
  const navigationRef = useNavigationContainerRef();
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => Grovs.startScreenTracking(navigationRef)}>
      {/* navigators */}
    </NavigationContainer>
  );
}
```

`startScreenTracking` returns an unsubscribe function, and calling it again replaces the previous subscription: screens are never double-tracked. Consecutive duplicate screen views within 1 second are deduplicated natively.

For Expo Router or custom navigators, track screens manually:

```tsx
Grovs.trackScreenView('Checkout', { section: 'payment' });
```

Map screen names to friendly names shown in the Grovs dashboard:

```tsx
Grovs.setScreenAliases({ Home: 'Home Page' });
```

### Native screen tracking

The native SDKs' own automatic screen tracking only sees the single React Native host Activity/ViewController, so it should be disabled in React Native apps:

- **Expo**: the config plugin disables it automatically. If you're upgrading the plugin, re-run `npx expo prebuild --clean`.
- **Manual / bare React Native**: pass `autoTrackScreenViews: false` in the native configure calls:

```swift
// iOS
Grovs.configure(APIKey: "...", useTestEnvironment: false, autoTrackScreenViews: false, enabled: GrovsWrapperSwift.isSDKEnabled(), delegate: GrovsWrapperSwift.shared)
```

```kotlin
// Android
Grovs.configure(this, "API_KEY", useTestEnvironment = false, baseURL = null, autoTrackScreenViews = false, clipboardDomains = null, enabled = GrovsConsent.isEnabled(this))
```

## API Reference

### Key Methods

| Method | Description |
|---|---|
| `onDeeplinkReceived(callback)` | Register deep link listener (returns `{ remove }`) |
| `setSDK(enabled)` | Enable or disable the SDK. Remembered across launches |
| `setDebug(level)` | Set logging level (`'info'`, `'error'`) |
| `setPushToken(token)` | Set FCM/APNs push token |
| `handleNotificationOpen(data)` | Handle a push tap from your push library. Resolves `true` for a Grovs push. On Android it only reports |
| `isGrovsNotification(data)` | Resolves `true` if the payload is from Grovs |
| `pauseInAppMessages()` / `resumeInAppMessages()` | Hold back or release in-app messages |
| `discardInAppMessages(opts?)` | Drop queued in-app messages. `{ dismissCurrent: true }` also closes the one on screen |
| `setInAppExcludedScreens(screens)` | Do not show in-app messages on these screens |
| `setInAppDebugLogging(enabled)` | Log in-app message activity |
| `onInAppMessage(callback)` | Listen to in-app events (returns `{ remove }`) |
| `setIdentifier(identifier)` | Set user ID for dashboard and reports |
| `setAttributes(attributes)` | Set user attributes for analytics |
| `generateLink(options)` | Generate a smart link (`GenerateLinkOptions`; positional form still supported). Rejects with `SDK_DISABLED` while disabled |
| `displayMessages()` | Deprecated. Show messages modal. Rejects with `SDK_DISABLED` while disabled |
| `numberOfUnreadMessages()` | Deprecated. Get unread message count. Rejects with `SDK_DISABLED` while disabled |
| `logInAppPurchase(purchase)` | Log a store purchase (`{ transactionId }` on iOS, `{ originalJson }` on Android) |
| `logCustomPurchase(type, priceInCents, currency, productId, startDate?)` | Log a custom purchase |
| `track(name, properties, tags)` | Track a custom analytics event |
| `trackScreenView(screenName, properties)` | Track a screen view |
| `setGlobalTags(tags)` | Attach tags to every subsequent event (call with no args to clear) |
| `setScreenAliases(aliases)` | Map screen names to friendly dashboard names |
| `startScreenTracking(navigationRef)` | Auto-track React Navigation screen changes (returns unsubscribe) |

Full API reference: [docs.grovs.io/docs/sdk/react-native/api-reference](https://docs.grovs.io/docs/sdk/react-native/api-reference)

## Example App

This repository has two example apps that use the local wrapper:

- [`example/`](example/): the new architecture (TurboModules)
- [`example_old_arch/`](example_old_arch/): the legacy bridge

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to run them. A standalone demo project is also available at [grovs-io/grovs-react-native-example-app](https://github.com/grovs-io/grovs-react-native-example-app).

## Migration Guides

- [Migrate from Firebase Dynamic Links](https://docs.grovs.io/docs/migration-guides/firebase-dynamic-links/android)
- [Migrate from Branch.io](https://docs.grovs.io/docs/migration-guides/branch-io/android)

## Documentation

Full documentation at [docs.grovs.io](https://docs.grovs.io).

## Support

For technical support and inquiries, contact [support@grovs.io](mailto:support@grovs.io).

## License

This project is licensed under the MIT License: see [LICENSE](LICENSE) for details.
