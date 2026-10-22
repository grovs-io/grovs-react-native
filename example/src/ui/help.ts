import type { Info } from './controls/Info';

const NATIVE_LOG =
  'the native log (Logcat on Android, the Xcode console on iOS)';

/** What each less obvious control does, in plain words, for people new to Grovs. */
export const help = {
  // Home
  sdkEnabled: {
    title: 'SDK enabled',
    body: "The Grovs SDK is the library this app uses to talk to Grovs. This switch is the user's consent (Grovs.setSDK). When off, the SDK stays installed but sends nothing to Grovs: no links, events or push data.",
  },
  pushToken: {
    title: 'Push token',
    body: 'Every install gets a token that push notifications are sent to. The SDK passes it to Grovs so you can reach this phone from a dashboard campaign. Copy it to send a test push to just this phone.',
  },
  openedFrom: {
    title: 'Opened from',
    body: 'Grovs links open your app when it is installed, and the SDK hands the link and its data to the app through Grovs.onDeeplinkReceived. This shows the last link that opened the app.',
  },
  identity: {
    title: 'Identity',
    body: 'Grovs groups links opened, events and purchases by user. The identifier is your own user id, for example from your login (Grovs.setIdentifier). Attributes are facts about the user, like plan or country, shown on their profile in the dashboard.',
  },
  quickActions: {
    title: 'Quick actions',
    body: 'Shortcuts to the most common tests. One tap runs the test with the values you last used on its tab. Hold a button to change the values first.',
  },

  // Links
  inspect: {
    title: 'Inspect a link',
    body: 'Every Grovs link is stored on the Grovs backend with its title, data and settings. Paste a link to load what is stored for it (Grovs.linkDetails). Useful for checking a link made here or in the dashboard.',
  },
  linkData: {
    title: 'Data',
    body: 'Custom values saved inside the link, like a promo code or the id of a product. When someone opens the link, your app gets this data back and can show the right screen. Tap the type badge to send a value as text, number or true/false.',
  },
  linkTags: {
    title: 'Tags',
    body: 'Labels for organizing links in the Grovs dashboard, for example by campaign or channel. They do not change how the link behaves.',
  },
  utm: {
    title: 'UTM tracking',
    body: 'UTM parameters are the standard way to name where traffic comes from: source (like newsletter), medium (like email) and campaign. Grovs uses them to show which campaign brought each open and install.',
  },
  customRedirects: {
    title: 'Custom redirects',
    body: 'When someone opens a link without the app installed, Grovs sends them somewhere: by default the store or website set in your project. Turn this on to choose a different place per platform for this one link.',
  },
  openAppIfInstalled: {
    title: 'Open app if installed',
    body: 'On: if the app is installed, the link opens it, and the URL above is only used when it is not. Off: the link always opens the URL above.',
  },
  platformOverrides: {
    title: 'Platform overrides',
    body: 'Per-link versions of two project settings. Preview shows a page with the link\'s title and image before redirecting. Clipboard copies the link on that page, so after installing, the app can still find which link brought the user. "Default" keeps the project\'s setting.',
  },

  // Events
  customEvent: {
    title: 'Custom event',
    body: 'Events are actions you report from your app, like signup or level_complete (Grovs.track). They appear in the dashboard and can trigger in-app messages. Some names are used by Grovs itself and rejected; "Send anyway" checks that.',
  },
  eventPropertiesAndTags: {
    title: 'Properties and tags',
    body: 'Properties are details sent with this one event, like level = 3. Tags are labels for filtering events in the dashboard, up to 20 per event.',
  },
  screenView: {
    title: 'Screen view',
    body: 'Grovs records which screens people visit, for analytics and for in-app message rules. Screens are reported with Grovs.trackScreenView, and the native SDK can also report its own screens (see Auto track screens in Settings). This reports one by hand. Hold Track to add properties.',
  },
  globalTags: {
    title: 'Global tags',
    body: 'Tags added to every event this app sends from now on, like beta or region_eu (Grovs.setGlobalTags). Handy for splitting all events by a group of users.',
  },
  screenAliases: {
    title: 'Screen aliases',
    body: 'An alias gives a screen a readable name in the dashboard (Grovs.setScreenAliases). The key is the screen name as reported, the value is the name to show.',
  },
  purchase: {
    title: 'Purchase',
    body: 'Grovs ties purchases to the link or campaign that brought the user, so you can see revenue per link. Use this for payments you handle yourself (Grovs.logCustomPurchase). Buy, cancel and refund are the types; the amount is sent in cents.',
  },
  startDate: {
    title: 'Start date',
    body: 'When the purchase happened. Choose an earlier date to test a purchase that is reported late.',
  },
  playPurchase: {
    title: 'In-app purchase',
    body: "For purchases made through the app store. On Android, paste the Google Play purchase's originalJson; on iOS, enter the StoreKit transaction id. The SDK sends it to Grovs to log the purchase (Grovs.logInAppPurchase).",
  },

  // In-app
  showMessage: {
    title: 'Show a message',
    body: 'In-app messages are pop-ups you design in the Grovs dashboard. Each campaign has a trigger: an event name. This sends that event, and a message shows if a live campaign uses it as its trigger.',
  },
  queue: {
    title: 'Queue',
    body: 'Messages wait in a queue until a good moment to show. Discard waiting drops queued messages. Close current also closes the one on screen. Both pause messages; switch to Running to resume.',
  },
  inAppDebug: {
    title: 'Debug logging',
    body: `Makes the SDK explain its in-app message decisions in ${NATIVE_LOG}: why a message was or was not shown.`,
  },
  excludedScreens: {
    title: 'Excluded screens',
    body: 'Screens where in-app messages never appear, like checkout. Use the screen name you report with Grovs.trackScreenView, like Excluded. Messages wait until the user leaves that screen.',
  },

  // Settings
  apiKey: {
    title: 'API key',
    body: 'Identifies your Grovs project, so the SDK sends data to the right place. Copy it from your project in the Grovs dashboard. Changes apply after a restart.',
  },
  environment: {
    title: 'Environment',
    body: "Each Grovs project has a test environment and a live (Prod) one, with separate data. Use Test while building so you don't mix test data with real users. Use the API key that matches.",
  },
  baseUrl: {
    title: 'Base URL',
    body: "The server the SDK talks to. Leave it empty for Grovs' own servers. Set it only to test against another backend, like a staging server; it must start with http:// or https://.",
  },
  clipboardDomains: {
    title: 'Clipboard domains',
    body: 'Deferred deep linking means the app finds the link that brought a user even after a fresh install. One way is through the clipboard. If your links use your own domain, list it here so the SDK trusts it. grovs.link and sqd.link always work.',
  },
  autoTrackScreens: {
    title: 'Auto track screens',
    body: 'When on, the native SDK reports a screen view each time one of its native screens appears, with no extra code. React Native screens are reported with Grovs.trackScreenView. Turn it off to report screens only by hand.',
  },
  startEnabled: {
    title: 'Start with SDK enabled',
    body: "Whether the user's consent starts as given on each launch. Off starts the SDK without sending anything until you turn it on from Home, like an app waiting for a consent popup.",
  },
  debugLevel: {
    title: 'Debug level',
    body: `How much the SDK writes to ${NATIVE_LOG}. Info shows every step, Error only failures.`,
  },
} satisfies Record<string, Info>;
