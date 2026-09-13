// index.ts - Unified wrapper with backward compatibility
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type {
  LogLevel,
  DeeplinkResponse,
  CustomRedirects,
  Tracking,
  TransactionType,
  InAppPurchase,
  GenerateLinkOptions,
  Any,
} from './NativeGrovsWrapper';
import { log } from './Logger';
import { startScreenTracking } from './ScreenTracking';
import type { NavigationContainerRefLike } from './ScreenTracking';

const LINKING_ERROR = `The package 'react-native-grovs-wrapper' doesn't seem to be linked. Make sure you properly integrated the native bindings.`;

// Feature detection for Turbo Modules
const isTurboModuleEnabled = (global as any).RN$Bridgeless === true;

interface GrovsWrapperInterface {
  setIdentifier(identifier?: string): void;
  setPushToken(pushToken?: string): void;
  setAttributes(attributes?: { [key: string]: Any }): void;
  setSDK(enabled: boolean): void;
  setDebug(level: LogLevel): void;
  track(
    name: string,
    properties?: { [key: string]: Any },
    tags?: Array<string>
  ): void;
  trackScreenView(
    screenName: string,
    properties?: { [key: string]: Any }
  ): void;
  setGlobalTags(tags?: Array<string>): void;
  setScreenAliases(aliases: { [key: string]: string }): void;
  generateLink(
    title?: string,
    subtitle?: string,
    imageURL?: string,
    data?: { [key: string]: Any },
    tags?: Array<Any>,
    customRedirects?: CustomRedirects,
    showPreviewIos?: boolean,
    showPreviewAndroid?: boolean,
    tracking?: Tracking,
    copyToClipboardIos?: boolean,
    copyToClipboardAndroid?: boolean
  ): Promise<string>;
  displayMessages(): Promise<void>;
  numberOfUnreadMessages(): Promise<number>;
  logInAppPurchase(
    transactionId?: string,
    originalJson?: string
  ): Promise<boolean>;
  logCustomPurchase(
    type: TransactionType,
    priceInCents: number,
    currency: string,
    productId: string,
    startDate?: string
  ): Promise<boolean>;
  onDeeplinkReceived: (callback: (data: DeeplinkResponse) => void) => {
    remove: () => void;
  };
  markReadyToHandleDeeplinks(): void;
}

function nativeErrorWithContext(context: string, error: unknown): Error {
  const wrapped = new Error(`${context}: ${(error as Error).message}`);
  if (error && typeof error === 'object' && 'code' in error) {
    return Object.assign(wrapped, { code: error.code });
  }
  return wrapped;
}

function hasOnDeeplinkReceived(obj: unknown): obj is {
  onDeeplinkReceived: (callback: (data: DeeplinkResponse) => void) => {
    remove(): void;
  };
} {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'onDeeplinkReceived' in obj &&
    typeof (obj as any).onDeeplinkReceived === 'function' &&
    typeof (obj as any).onDeeplinkReceived(() => {}).remove === 'function'
  );
}

function hasAddDeeplinkListener(
  obj: unknown
): obj is { addDeeplinkListener: () => void } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'addDeeplinkListener' in obj &&
    typeof (obj as any).addDeeplinkListener === 'function'
  );
}

let GrovsWrapperModule: GrovsWrapperInterface;

if (isTurboModuleEnabled) {
  try {
    // Try to import Turbo Module
    GrovsWrapperModule = require('./NativeGrovsWrapper').default;
    log('info', 'Turbo modules enabled - using Turbo modules');
  } catch (e) {
    log(
      'info',
      'Turbo modules enabled but not available - falling back to legacy bridge'
    );
    GrovsWrapperModule = NativeModules.GrovsWrapper;
  }
} else {
  // Use legacy bridge
  GrovsWrapperModule = NativeModules.GrovsWrapper;
  log('info', 'Turbo modules disabled - falling back to legacy bridge');
}

if (!GrovsWrapperModule) {
  log('error', LINKING_ERROR);
  throw new Error(LINKING_ERROR);
}

class GrovsWrapper {
  private module: GrovsWrapperInterface;
  private listeners: Set<(data: DeeplinkResponse) => void> = new Set();
  private stopScreenTracking?: () => void;

  constructor() {
    this.module = GrovsWrapperModule;

    if (hasAddDeeplinkListener(this.module)) {
      log(
        'info',
        'Has native addDeeplinkListener - registering addDeeplinkListener'
      );
      this.module.addDeeplinkListener();
    }

    if (NativeModules.GrovsWrapper) {
      log(
        'info',
        'Has NativeModules.GrovsWrapper - registering adding event listener'
      );
      const emitter = new NativeEventEmitter(NativeModules.GrovsWrapper);
      emitter.addListener('onGrovsDeeplinkReceived', (data) => {
        this.triggerDeeplink(data);
      });
    }
  }

  /**
   * Set user identifier
   * @param identifier - User identifier
   */
  setIdentifier(identifier?: string): void {
    this.module.setIdentifier(identifier);
  }

  /**
   * Set push token
   * @param pushToken - Push notification token
   */
  setPushToken(pushToken?: string): void {
    this.module.setPushToken(pushToken);
  }

  /**
   * Set user attributes
   * @param attributes - User attributes
   */
  setAttributes(attributes?: { [key: string]: Any }): void {
    this.module.setAttributes(attributes);
  }

  /**
   * Enable/disable SDK
   * @param enabled - SDK enabled state
   */
  setSDK(enabled: boolean): void {
    this.module.setSDK(enabled);
  }

  /**
   * Set debug level
   * @param level - Debug level
   */
  setDebug(level: LogLevel): void {
    this.module.setDebug(level);
  }

  /**
   * Track a custom analytics event.
   *
   * Validation happens natively: the name must not be empty or a reserved
   * system event name (view, open, install, reinstall, app_open, time_spent,
   * reactivation, user_referred, custom, screen_view); properties over 8KB
   * are dropped; tags are capped at 20.
   * @param name - Event name
   * @param properties - Optional event properties
   * @param tags - Optional tags, merged with global tags
   */
  track(
    name: string,
    properties?: { [key: string]: Any },
    tags?: Array<string>
  ): void {
    this.module.track(name, properties, tags);
  }

  /**
   * Track a screen view event. Consecutive duplicates within 1 second are
   * deduplicated natively.
   * @param screenName - Name of the screen being viewed
   * @param properties - Optional additional properties
   */
  trackScreenView(
    screenName: string,
    properties?: { [key: string]: Any }
  ): void {
    this.module.trackScreenView(screenName, properties);
  }

  /**
   * Set tags attached to every subsequently tracked event.
   * @param tags - Tags to attach, or undefined to clear
   */
  setGlobalTags(tags?: Array<string>): void {
    this.module.setGlobalTags(tags);
  }

  /**
   * Map screen identifiers to friendly names shown in the Grovs dashboard.
   * @param aliases - e.g. { Home: 'Home Page' }
   */
  setScreenAliases(aliases: { [key: string]: string }): void {
    this.module.setScreenAliases(aliases);
  }

  /**
   * Automatically track React Navigation screen changes as screen views.
   * Call from NavigationContainer's onReady:
   *
   * ```tsx
   * const navigationRef = useNavigationContainerRef();
   * <NavigationContainer
   *   ref={navigationRef}
   *   onReady={() => Grovs.startScreenTracking(navigationRef)}>
   * ```
   *
   * Calling this again replaces the previous subscription: the earlier
   * listener is unsubscribed first, so screens are never double-tracked
   * (e.g. when onReady fires again after a container remount).
   *
   * @param navigationRef - The navigation container ref
   * @returns An unsubscribe function that stops tracking
   */
  startScreenTracking(navigationRef: NavigationContainerRefLike): () => void {
    this.stopScreenTracking?.();
    this.stopScreenTracking = startScreenTracking(navigationRef, (screenName) =>
      this.trackScreenView(screenName)
    );
    return this.stopScreenTracking;
  }

  /**
   * Generate a deep link.
   *
   * Preferred form: pass a single `GenerateLinkOptions` object. The positional
   * form is kept for backward compatibility; its two trailing arguments are the
   * copy-to-clipboard flags.
   *
   * `copyToClipboardIos` / `copyToClipboardAndroid` control whether the link's
   * landing page copies the link to the clipboard so the SDK can match the
   * install afterwards. Leave them undefined to inherit the project default.
   *
   * Rejects with `SDK_DISABLED` when the SDK has been disabled via `setSDK(false)`.
   * @returns Generated link
   */
  generateLink(options: GenerateLinkOptions): Promise<string>;
  // eslint-disable-next-line no-dupe-class-members
  generateLink(
    title?: string,
    subtitle?: string,
    imageURL?: string,
    data?: { [key: string]: Any },
    tags?: Array<Any>,
    customRedirects?: CustomRedirects,
    showPreviewIos?: boolean,
    showPreviewAndroid?: boolean,
    tracking?: Tracking,
    copyToClipboardIos?: boolean,
    copyToClipboardAndroid?: boolean
  ): Promise<string>;
  // eslint-disable-next-line no-dupe-class-members
  async generateLink(
    titleOrOptions?: string | GenerateLinkOptions,
    subtitle?: string,
    imageURL?: string,
    data?: { [key: string]: Any },
    tags?: Array<Any>,
    customRedirects?: CustomRedirects,
    showPreviewIos?: boolean,
    showPreviewAndroid?: boolean,
    tracking?: Tracking,
    copyToClipboardIos?: boolean,
    copyToClipboardAndroid?: boolean
  ): Promise<string> {
    const options: GenerateLinkOptions =
      typeof titleOrOptions === 'object' && titleOrOptions !== null
        ? titleOrOptions
        : {
            title: titleOrOptions,
            subtitle,
            imageURL,
            data,
            tags,
            customRedirects,
            showPreviewIos,
            showPreviewAndroid,
            tracking,
            copyToClipboardIos,
            copyToClipboardAndroid,
          };

    try {
      const link = await this.module.generateLink(
        options.title,
        options.subtitle,
        options.imageURL,
        options.data,
        options.tags,
        options.customRedirects,
        options.showPreviewIos,
        options.showPreviewAndroid,
        options.tracking,
        options.copyToClipboardIos,
        options.copyToClipboardAndroid
      );
      return link;
    } catch (error) {
      throw nativeErrorWithContext('Failed to generate link', error);
    }
  }

  /**
   * Display messages
   */
  async displayMessages(): Promise<void> {
    try {
      await this.module.displayMessages();
    } catch (error) {
      throw nativeErrorWithContext('Failed to display messages', error);
    }
  }

  /**
   * Get number of unread messages
   * @returns Number of unread messages
   */
  async numberOfUnreadMessages(): Promise<number> {
    try {
      const count = await this.module.numberOfUnreadMessages();
      return count;
    } catch (error) {
      throw nativeErrorWithContext(
        'Failed to get unread messages count',
        error
      );
    }
  }

  /**
   * Log a store in-app purchase for revenue tracking.
   *
   * Platform-specific input (each platform ignores the other's field):
   * - iOS: `transactionId` — the StoreKit 2 transaction identifier (numeric string).
   * - Android: `originalJson` — the Google Play Billing purchase original JSON.
   * @param purchase - The purchase to log
   * @returns Whether the purchase was accepted natively
   */
  async logInAppPurchase(purchase: InAppPurchase): Promise<boolean> {
    const { transactionId, originalJson } = purchase ?? {};
    if (Platform.OS === 'ios') {
      if (!transactionId || !/^\d+$/.test(transactionId)) {
        throw new Error(
          'logInAppPurchase requires a numeric transactionId on iOS'
        );
      }
    } else if (!originalJson) {
      throw new Error('logInAppPurchase requires originalJson on Android');
    }
    try {
      return await this.module.logInAppPurchase(transactionId, originalJson);
    } catch (error) {
      throw new Error(
        `Failed to log in-app purchase: ${(error as Error).message}`
      );
    }
  }

  async logCustomPurchase(
    type: TransactionType,
    priceInCents: number,
    currency: string,
    productId: string,
    startDate?: string
  ): Promise<boolean> {
    try {
      return await this.module.logCustomPurchase(
        type,
        priceInCents,
        currency,
        productId,
        startDate
      );
    } catch (error) {
      throw new Error(
        `Failed to log custom purchase: ${(error as Error).message}`
      );
    }
  }

  /**
   * Event emitter for deeplink received events
   * @returns Event emitter with addListener and removeAllListeners methods
   */
  onDeeplinkReceived(callback: (data: DeeplinkResponse) => void) {
    log('info', 'Registering deeplink received');
    if (hasOnDeeplinkReceived(this.module)) {
      log('info', 'Using turbo module - using onDeeplinkReceived');
      const sub = this.module.onDeeplinkReceived(callback);
      return { remove: () => sub.remove() };
    }

    log('info', 'Bridge mode - registering callback');
    this.listeners.add(callback);
    this.markReadyToHandleDeeplinks();

    return {
      remove: () => {
        this.listeners.delete(callback);
      },
    };
  }

  markReadyToHandleDeeplinks(): void {
    this.module.markReadyToHandleDeeplinks();
  }

  // Trigger all listeners when a deeplink is received
  private triggerDeeplink(data: DeeplinkResponse) {
    for (const cb of this.listeners) {
      cb(data);
    }
  }
}

// Export singleton instance
export default new GrovsWrapper();

// Also export class for advanced usage
export { GrovsWrapper };

// Export types for TypeScript users
export type {
  LogLevel,
  AnyPrimitive,
  Any,
  DeeplinkResponse,
  CustomLinkRedirect,
  CustomRedirects,
  TransactionType,
  InAppPurchase,
  GenerateLinkOptions,
} from './NativeGrovsWrapper';
export type { NavigationContainerRefLike } from './ScreenTracking';
