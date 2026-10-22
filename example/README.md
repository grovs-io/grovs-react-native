# Grovs React Native test app

A small app to try every call of the Grovs React Native wrapper by hand. It is modelled on the Grovs Android test app. It is not a template for your own app.

## Run it

Run everything from the `example` folder, after `yarn install` at the repo root.

Start Metro:

```sh
yarn start
```

### iOS

```sh
cd ios && bundle install && bundle exec pod install && cd ..
yarn ios
```

### Android

Use JDK 17 (`JAVA_HOME` must point to it). The app also needs a Firebase file at `android/app/google-services.json`. It is already in the repo. Replace it with your own if you change the application id (`io.grovs.example`).

```sh
yarn android
```

## What each tab tests

- **Home**: the SDK on/off switch, the active project, notification permission and the push token, the link the app was opened from, user identity (id and attributes), and quick actions: Generate link, Open clipboard, Track event and Purchase.
- **Links**: build a link (title, subtitle, image, tags, data, custom redirects, access and tracking options), generate it, then copy, share, show it as a QR code, or inspect it. Inspect calls `Grovs.linkDetails`. The result card also shows the command to open the link on a device (`adb` on Android, `xcrun simctl` on iOS) so you can test a cold start.
- **Events**: track custom events with tags and data, screen views (with global tags and screen aliases), and purchases. Reserved event names (`view`, `open`, `install`, `reinstall`, `app_open`, `time_spent`, `reactivation`, `user_referred`, `custom`, `screen_view`) show a warning, with a "Send anyway" button if you want to send them. Purchases use a Play JSON on Android and an App Store transaction id on iOS.
- **In-app**: turn message display on or off, trigger a message, manage the queue (discard waiting, close current), set debug logging and the excluded screens (a second screen lets you open one to check no message shows).
- **Settings**: pick the profile and change SDK options (see below).

## Settings and profiles

A profile is an SDK key, an environment (test or production), an optional base URL, and a few options. The first launch uses the profile "Grovs test". You can add, edit and remove profiles.

The SDK is configured natively before React Native starts, so a change to the key, environment, base URL or options only applies after a restart. When something needs it, a bar at the bottom of Settings says "Restart to apply".

- Android: the button relaunches the app.
- iOS: an app cannot relaunch itself. The button closes the app and you open it again.

## Logs

The strip at the top shows the latest log line. Tap it to open the logs panel with the full history (up to 500 entries in memory). Tap an entry to see its detail, and export the log. The last 50 link opens are kept between launches. The ↻ button on an entry runs that action again.

## iOS and Android differences

- Inspect works on both platforms.
- Cold start commands: `adb shell am start -a android.intent.action.VIEW -d "<link>"` on Android, `xcrun simctl openurl booted "<link>"` on iOS. Both are shown on the link result card.
- Purchases: Play JSON on Android, App Store transaction id on iOS.
- There is no "Block all messages" switch, because the wrapper has no way to veto messages.
- There is no call style option.
- Restart: relaunch on Android, close on iOS.

## Fonts

The app uses Geist and Geist Mono, shipped in `assets/fonts` under the SIL Open Font License. The license text is in `assets/licenses/geist-OFL.txt`.
