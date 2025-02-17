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


```js
import { Grovs } from 'react-native-grovs-wrapper';
```


## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
