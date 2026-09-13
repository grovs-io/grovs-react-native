import type { TurboModule } from 'react-native';
import { TurboModuleRegistry, NativeEventEmitter } from 'react-native';
import { log } from './Logger';

export type LogLevel = 'info' | 'error';
export type AnyPrimitive = string | number | boolean;
export type Any = string | number | boolean | Array<AnyPrimitive>;
export interface DeeplinkResponse {
  link: string;
  data?: { [key: string]: Any };
}
export interface CustomLinkRedirect {
  link: string;
  open_if_app_installed: boolean;
}
export interface CustomRedirects {
  ios: CustomLinkRedirect;
  android: CustomLinkRedirect;
  desktop: CustomLinkRedirect;
}
export interface Tracking {
  utm_medium?: string;
  utm_source?: string;
  utm_campaign?: string;
}
export interface InAppPurchase {
  transactionId?: string;
  originalJson?: string;
}

export type TransactionType = 'buy' | 'cancel' | 'refund';

export interface GenerateLinkOptions {
  title?: string;
  subtitle?: string;
  imageURL?: string;
  data?: { [key: string]: Any };
  tags?: Array<Any>;
  customRedirects?: CustomRedirects;
  showPreviewIos?: boolean;
  showPreviewAndroid?: boolean;
  tracking?: Tracking;
  /** Copy the link to the clipboard on the iOS landing page. `undefined` inherits the project default. */
  copyToClipboardIos?: boolean;
  /** Copy the link to the clipboard on the Android landing page. `undefined` inherits the project default. */
  copyToClipboardAndroid?: boolean;
}

export interface Spec extends TurboModule {
  setIdentifier(identifier?: string): void;
  setPushToken(pushToken?: string): void;
  setAttributes(attributes?: { [key: string]: Any }): void;
  setSDK(enabled: boolean): void;
  setDebug(level: LogLevel): void;
  generateLink(
    title?: string,
    subtitle?: string,
    imageURL?: string,
    data?: { [key: string]: Any },
    tags?: Array<Any>,
    customRedirects?: { [key: string]: Any },
    showPreviewIos?: boolean,
    showPreviewAndroid?: boolean,
    tracking?: { [key: string]: Any },
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
    type: string,
    priceInCents: number,
    currency: string,
    productId: string,
    startDate?: string
  ): Promise<boolean>;
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

  //readonly onDeeplinkReceived: EventEmitter<DeeplinkResponse>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;

  markReadyToHandleDeeplinks(): void;
}

// Get the native module from RN's registry
const NativeModule = TurboModuleRegistry.get<Spec>('GrovsWrapper');

if (!NativeModule) {
  log(
    'info',
    'Turbo module - Native module react-native-grovs-wrapper is not linked properly.'
  );
  throw new Error(
    'Native module react-native-grovs-wrapper is not linked properly.'
  );
}

export class TurboModuleGrovs {
  // Simple methods
  setIdentifier(identifier?: string) {
    NativeModule?.setIdentifier(identifier);
  }

  setPushToken(pushToken?: string) {
    NativeModule?.setPushToken(pushToken);
  }

  setAttributes(attributes?: { [key: string]: Any }) {
    NativeModule?.setAttributes(attributes);
  }

  setSDK(enabled: boolean) {
    NativeModule?.setSDK(enabled);
  }

  setDebug(level: LogLevel) {
    NativeModule?.setDebug(level);
  }

  track(
    name: string,
    properties?: { [key: string]: Any },
    tags?: Array<string>
  ) {
    NativeModule?.track(name, properties, tags);
  }

  trackScreenView(screenName: string, properties?: { [key: string]: Any }) {
    NativeModule?.trackScreenView(screenName, properties);
  }

  setGlobalTags(tags?: Array<string>) {
    NativeModule?.setGlobalTags(tags);
  }

  setScreenAliases(aliases: { [key: string]: string }) {
    NativeModule?.setScreenAliases(aliases);
  }

  async generateLink(
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
  ): Promise<string> {
    if (!NativeModule) {
      throw new Error('Native module GrovsWrapper is not linked');
    }

    return NativeModule?.generateLink(
      title,
      subtitle,
      imageURL,
      data,
      tags,
      customRedirects as { [key: string]: Any } | undefined,
      showPreviewIos,
      showPreviewAndroid,
      tracking as { [key: string]: Any } | undefined,
      copyToClipboardIos,
      copyToClipboardAndroid
    );
  }

  async displayMessages(): Promise<void> {
    return NativeModule?.displayMessages();
  }

  async numberOfUnreadMessages(): Promise<number> {
    if (!NativeModule) {
      throw new Error('Native module GrovsWrapper is not linked');
    }

    return NativeModule?.numberOfUnreadMessages();
  }

  async logInAppPurchase(
    transactionId?: string,
    originalJson?: string
  ): Promise<boolean> {
    if (!NativeModule) {
      throw new Error('Native module GrovsWrapper is not linked');
    }
    return NativeModule.logInAppPurchase(transactionId, originalJson);
  }

  async logCustomPurchase(
    type: string,
    priceInCents: number,
    currency: string,
    productId: string,
    startDate?: string
  ): Promise<boolean> {
    if (!NativeModule) {
      throw new Error('Native module GrovsWrapper is not linked');
    }
    return NativeModule.logCustomPurchase(
      type,
      priceInCents,
      currency,
      productId,
      startDate
    );
  }

  // Event subscription wrapper
  onDeeplinkReceived(callback: (data: DeeplinkResponse) => void): {
    remove: () => void;
  } {
    const eventEmitter =
      NativeModule == null ? null : new NativeEventEmitter(NativeModule);
    log('info', 'Turbo module - registering callback');
    const subscription = eventEmitter?.addListener(
      'onGrovsDeeplinkReceived',
      callback
    );

    NativeModule?.markReadyToHandleDeeplinks();
    return {
      remove: () => subscription?.remove(),
    };
  }
}

// Export a singleton instance if that fits your architecture
export default new TurboModuleGrovs();
