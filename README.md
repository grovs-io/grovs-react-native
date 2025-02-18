# Grovs React-native Wrapper

[Grovs](https://grovs.io) is a powerful SDK that enables deep linking and universal linking within your React native applications. This document serves as a guide to integrate and utilize Grovs seamlessly within your project.

<br />

## Installation

### React

Add the Grovs react-native wrapper as a `package.json` depedency.

**yarn**
```sh
yarn add react-native-grovs-wrapper
```

**npm**
```sh
npm install react-native-grovs-wrapper
```

### Android

Add Grovs Android SDK as a dependency in your `PROJECT_DIR/android/app/build.gradle`

```sh
dependencies {
  implementation 'io.grovs:Grovs:1.0.1'
}
```

### iOS

On iOS the Grovs SDK dependency is added automatically using cocoapods.

## Configuration

### Android

To configure the Grovs SDK within your Android application, follow these steps:

1. Initialize the SDK with your API key (usually in your `Application` class):

```kotlin
override fun onCreate() {
    super.onCreate()

    Grovs.configure(this, "your-api-key")
}
```

2. In your **launcher activity** add the code for handling incoming links:

```kotlin
override fun onStart() {
    super.onStart()

    Grovs.onStart()
}

override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)

    Grovs.onNewIntent(intent)
}
```

3. Add intent filters to your **launcher activity** in the `AndroidManifest.xml` file to register your app for opening the grovs links:

```xml
<intent-filter>
    <data android:scheme="your_app_scheme" android:host="open" />
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
</intent-filter>

<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="your_app_host" />
</intent-filter>

<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="your_app_test_host" />
</intent-filter>
```

### iOS

To configure the Grovs SDK within your application, follow these steps:

1. Import the Grovs module in your Swift file:

```swift
import Grovs
```

1. Initialize the SDK with your API key (usually in AppDelegate):

```swift
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
    Grovs.configure(APIKey: "your-api-key", delegate: yourDelegate)
    # Optionally, you can adjust the debug level for logging:
    Grovs.setDebug(level: .info)

    ... Your other code ...
}
```


## Usage

Once configured, you can utilize the various functionalities provided by Grovs.

```js
import { Grovs } from 'react-native-grovs-wrapper';
```

### Handling deeplinks

You can receive deep link events by registering a listener. Here's how you can implement it:

```kotlin
const listener = Grovs.onDeeplinkReceived((data) => {
    console.log(data);
});

// When you don't want to receive events anymore
listener.remove(); // Stop receiving events
```

### Generating Links

You can generate links using `generateLink` functions, below are some examples:

```js
try {
    const link = await Grovs.generateLink("Title", "Subtitle", "url_to_some_image", { param1: "value", param2: "value" }, ["tag1", "tag2"]);
    console.log(`Generated link: ${link}`);
} catch (error) {
    console.log("Error generating link:", error);
}
```

### Using messages

IMPORTANT: if console messages have automatic display enabled, they will appear in your app without any additional integration required.

To receive push notifications for the received messages attach the device token to the SDK.

```js
import messaging from "@react-native-firebase/messaging";

const token = await messaging().getToken();
if (token) {
    Grovs.setPushToken(token);
    console.log("FCM Token:", token);
} else {
    console.log("Failed to get FCM token");
}
```

To get the number of unread messages, for instance if you want to display an unread number bullet, you can use the following method.

```js
const unreadCount = await Grovs.numberOfUnreadMessages();
console.log(`Unread messages: ${unreadCount}`);
```

To display the list of the messages on top of everything else use:

```js
Grovs.displayMessages();
```

## Demo project

You can download and run a demo project [from here](https://github.com/grovs-io/grovs-react-native-example-app).

## Further Assistance

For further assistance and detailed documentation, refer to the Grovs documentation available at [https://grovs.io/docs](https://docs.grovs.io/s/docs).

For technical support and inquiries, contact our support team at [support@grovs.io](mailto:support@grovs.io).

Thank you for choosing Grovs! We're excited to see what you build with our SDK.

<br />
<br />
Copyright grovs.
