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
    customRedirects?: CustomRedirects,
    showPreviewIos?: boolean,
    showPreviewAndroid?: boolean
  ): Promise<string>;
  displayMessages(): Promise<void>;
  numberOfUnreadMessages(): Promise<number>;

  //readonly onDeeplinkReceived: EventEmitter<DeeplinkResponse>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
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

  async generateLink(
    title?: string,
    subtitle?: string,
    imageURL?: string,
    data?: { [key: string]: Any },
    tags?: Array<Any>,
    customRedirects?: CustomRedirects,
    showPreviewIos?: boolean,
    showPreviewAndroid?: boolean
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
      customRedirects,
      showPreviewIos,
      showPreviewAndroid
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
    return {
      remove: () => subscription?.remove(),
    };
  }
}

// Export a singleton instance if that fits your architecture
export default new TurboModuleGrovs();
