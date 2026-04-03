<p align="center">
  <a href="https://grovs.io">
    <img src="https://s3.eu-north-1.amazonaws.com/grovs.io/full-black.svg" alt="Grovs" width="220" />
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

- **Deep linking & universal links** — route users to the right in-app screen, even after install
- **Smart link generation** — create trackable links with metadata, custom redirects, and UTM parameters
- **In-app messaging** — display messages and announcements from the Grovs dashboard
- **Push notifications** — receive push notifications for dashboard-sent messages
- **Revenue tracking** — log App Store, Google Play, and custom purchases with automatic attribution
- **User identity** — attach user IDs and attributes for analytics and segmentation
- **Self-hosting support** — point the SDK at your own backend
- **Expo support** — config plugin for automated native setup

## Requirements

- React Native 0.70+
- iOS 13.0+
- Android API 21+ (Android 5.0)

## Installation

```bash
# Using npm
npm install react-native-grovs-wrapper

# Using yarn
yarn add react-native-grovs-wrapper
```

### Android dependency

Add the Grovs Android SDK to `android/app/build.gradle`:

```groovy
dependencies {
    implementation 'io.grovs:Grovs:1.1.1'
}
```

### iOS dependency

The iOS SDK is added automatically via CocoaPods when you run `pod install`.

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
      "baseURL": "https://your-domain.com"
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

Then run `npx expo prebuild` and build with `npx expo run:ios` / `npx expo run:android`.

> **Note:** This requires a development build (`expo-dev-client`), not Expo Go.

## Manual Configuration

### Android

**1. Initialize the SDK** in your `MainApplication` class:

```kotlin
override fun onCreate() {
    super.onCreate()
    Grovs.configure(this, "your-api-key", useTestEnvironment = false)
    // Optional: use a custom base URL for self-hosted backends
    // Grovs.configure(this, "your-api-key", useTestEnvironment = false, baseURL = "https://your-domain.com")
}
```

**2. Handle incoming links** in your `MainActivity`:

```kotlin
override fun onStart() {
    super.onStart()
    Grovs.onStart(this)
}

override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    Grovs.onNewIntent(intent, this)
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

func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    Grovs.configure(APIKey: "your-api-key", useTestEnvironment: false, delegate: self)
    // Optional: use a custom base URL for self-hosted backends
    // Grovs.configure(APIKey: "your-api-key", useTestEnvironment: false, baseURL: "https://your-domain.com", delegate: self)
    Grovs.setDebug(level: .info)
    return true
}

func grovsReceivedPayloadFromDeeplink(link: String?, payload: [String: Any]?, tracking: [String: Any]?) {
    // Native delegate callback
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

## Link Generation

Create smart links with metadata, payload data, and tracking parameters:

```typescript
try {
    const link = await Grovs.generateLink(
        'Check out this product',           // title
        'Limited time offer',               // subtitle
        'https://example.com/image.jpg',    // imageURL
        {                                   // data
            productId: '12345',
            screen: 'product_detail',
        },
        ['promotion', 'share'],             // tags
        {                                   // customRedirects
            android: { link: 'https://example.com/android', open_if_app_installed: true },
            ios: { link: 'https://example.com/ios', open_if_app_installed: true },
            desktop: { link: 'https://example.com/desktop', open_if_app_installed: false },
        },
        false,                              // showPreviewIos
        false,                              // showPreviewAndroid
        {                                   // tracking
            utm_campaign: 'spring_sale',
            utm_source: 'in_app',
            utm_medium: 'share_button',
        }
    );
    console.log('Generated:', link);
} catch (error) {
    console.error('Error:', error);
}
```

## Messages

> If console messages have **automatic display** enabled in your dashboard, they will appear in your app without any additional integration.

### Push notifications

Pass the FCM token to receive push notifications for dashboard-sent messages:

```typescript
import messaging from '@react-native-firebase/messaging';

const token = await messaging().getToken();
if (token) {
    Grovs.setPushToken(token);
}
```

Upload your Firebase or APNs credentials in the [Grovs dashboard](https://app.grovs.io).

### Display messages

```typescript
// Show the messages list as a modal
await Grovs.displayMessages();

// Get unread count for badges
const count = await Grovs.numberOfUnreadMessages();
console.log(`Unread: ${count}`);
```

## Revenue Tracking

> Revenue tracking is currently in **beta**.

### Setup

1. Enable revenue tracking in the [Grovs dashboard](https://app.grovs.io) under **Settings → Revenue Tracking**
2. Configure platform notifications:
   - **Android** — Set up Google Play Real-Time Developer Notifications
   - **iOS** — Configure App Store Server Notifications in App Store Connect

### Platform store purchases

```typescript
// iOS: pass the StoreKit 2 transaction ID as a string
// Android: pass the Google Play purchase.originalJson string
const success = await Grovs.logInAppPurchase(transactionId);
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

## API Reference

### Key Methods

| Method | Description |
|---|---|
| `onDeeplinkReceived(callback)` | Register deep link listener (returns `{ remove }`) |
| `setSDK(enabled)` | Enable or disable the SDK |
| `setDebug(level)` | Set logging level (`'info'`, `'error'`) |
| `setPushToken(token)` | Set FCM/APNs push token |
| `setIdentifier(identifier)` | Set user ID for dashboard and reports |
| `setAttributes(attributes)` | Set user attributes for analytics |
| `generateLink(title, subtitle, imageURL, data, tags, customRedirects, showPreviewIos, showPreviewAndroid, tracking)` | Generate a smart link |
| `displayMessages()` | Show messages modal |
| `numberOfUnreadMessages()` | Get unread message count |
| `logInAppPurchase(transactionId)` | Log a store purchase |
| `logCustomPurchase(type, priceInCents, currency, productId, startDate)` | Log a custom purchase |

Full API reference: [docs.grovs.io/docs/sdk/react-native/api-reference](https://docs.grovs.io/docs/sdk/react-native/api-reference)

## Example App

A demo project is available at [grovs-io/grovs-react-native-example-app](https://github.com/grovs-io/grovs-react-native-example-app).

## Migration Guides

- [Migrate from Firebase Dynamic Links](https://docs.grovs.io/docs/migration-guides/firebase-dynamic-links/android)
- [Migrate from Branch.io](https://docs.grovs.io/docs/migration-guides/branch-io/android)

## Documentation

Full documentation at [docs.grovs.io](https://docs.grovs.io).

## Support

For technical support and inquiries, contact [support@grovs.io](mailto:support@grovs.io).

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
