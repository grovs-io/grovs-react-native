import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

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
    showPreview?: boolean
  ): Promise<string>;
  displayMessages(): Promise<void>;
  numberOfUnreadMessages(): Promise<number>;

  readonly onDeeplinkReceived: EventEmitter<DeeplinkResponse>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('GrovsWrapper');
