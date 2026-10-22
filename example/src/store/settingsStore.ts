import type { LogLevel } from 'react-native-grovs-wrapper';
import {
  decodeEventForm,
  decodeLinkForm,
  decodePurchaseForm,
  decodeRows,
  decodeScreenForm,
  encodeEventForm,
  encodeLinkForm,
  encodePurchaseForm,
  encodeScreenForm,
  type EventForm,
  type LinkForm,
  type PurchaseForm,
  type ScreenForm,
} from '../data/forms';
import type { KeyValueRow } from '../data/keyValue';
import {
  DEFAULT_PROFILES,
  decodeProfiles,
  encodeProfiles,
  type Profile,
} from '../data/profile';
import { exampleStore, NativeKeys } from './exampleStore';

/** An empty identifier means none. */
export type Identity = { identifier: string; attributes: KeyValueRow[] };

export const DEFAULT_IDENTITY: Identity = {
  identifier: 'React native id',
  attributes: [
    { key: 'string', value: 'string value', type: 'text' },
    { key: 'boolean', value: 'true', type: 'bool' },
    { key: 'number', value: '13', type: 'number' },
    { key: 'number 2', value: '13.2', type: 'number' },
  ],
};

export type SavedForms = {
  linkForm: LinkForm;
  eventForm: EventForm;
  screenForm: ScreenForm;
  purchaseForm: PurchaseForm;
};
export type FormKey = keyof SavedForms;

type FormListener = (key: FormKey) => void;
const formListeners = new Set<FormListener>();

function putForm(key: FormKey, json: string) {
  exampleStore.set(key, json);
  formListeners.forEach((listener) => listener(key));
}

export const DEFAULT_EXCLUDED_SCREENS = ['Excluded'];

export const DEFAULT_SCREEN_ALIASES: KeyValueRow[] = [
  { key: 'Home', value: 'Home screen', type: 'text' },
];

const LOG_LEVELS: readonly LogLevel[] = ['info', 'error'];

function parse(key: string): unknown {
  const json = exampleStore.get(key);
  if (json === undefined) return undefined;
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

const putJson = (key: string, value: unknown) =>
  exampleStore.set(key, JSON.stringify(value));

function readStrings(key: string, fallback: string[]): string[] {
  const list = parse(key);
  return Array.isArray(list)
    ? list.filter((v): v is string => typeof v === 'string')
    : [...fallback];
}

function readBool(key: string, fallback: boolean): boolean {
  const value = exampleStore.get(key);
  return value === undefined ? fallback : value === 'true';
}

const putBool = (key: string, value: boolean) =>
  exampleStore.set(key, String(value));

function readIdentity(): Identity {
  const o = parse('identity') as Partial<Record<keyof Identity, unknown>>;
  if (typeof o !== 'object' || o === null) return DEFAULT_IDENTITY;
  return {
    identifier: typeof o.identifier === 'string' ? o.identifier : '',
    attributes: decodeRows(o.attributes, []),
  };
}

function readProfiles(): Profile[] {
  try {
    const profiles = decodeProfiles(
      exampleStore.get(NativeKeys.profiles) ?? ''
    );
    return profiles.length > 0 ? profiles : DEFAULT_PROFILES;
  } catch {
    return DEFAULT_PROFILES;
  }
}

/** Typed access to the app's saved settings. Reads need `exampleStore.load()` to have finished. */
export const settingsStore = {
  /** Calls the listener with the key of each saved form that changes. */
  subscribeForms(listener: FormListener): () => void {
    formListeners.add(listener);
    return () => {
      formListeners.delete(listener);
    };
  },

  get identity(): Identity {
    return readIdentity();
  },
  set identity(value: Identity) {
    putJson('identity', value);
  },

  /** The last value sent to setSDK. */
  get sdkEnabled(): boolean {
    return readBool('sdkEnabled', true);
  },
  set sdkEnabled(value: boolean) {
    putBool('sdkEnabled', value);
  },

  get linkForm(): LinkForm {
    return decodeLinkForm(exampleStore.get('linkForm'));
  },
  set linkForm(value: LinkForm) {
    putForm('linkForm', encodeLinkForm(value));
  },

  get eventForm(): EventForm {
    return decodeEventForm(exampleStore.get('eventForm'));
  },
  set eventForm(value: EventForm) {
    putForm('eventForm', encodeEventForm(value));
  },

  get screenForm(): ScreenForm {
    return decodeScreenForm(exampleStore.get('screenForm'));
  },
  set screenForm(value: ScreenForm) {
    putForm('screenForm', encodeScreenForm(value));
  },

  get purchaseForm(): PurchaseForm {
    return decodePurchaseForm(exampleStore.get('purchaseForm'));
  },
  set purchaseForm(value: PurchaseForm) {
    putForm('purchaseForm', encodePurchaseForm(value));
  },

  get globalTags(): string[] {
    return readStrings('globalTags', []);
  },
  set globalTags(value: string[]) {
    putJson('globalTags', value);
  },

  get screenAliases(): KeyValueRow[] {
    return decodeRows(parse('screenAliases'), DEFAULT_SCREEN_ALIASES);
  },
  set screenAliases(value: KeyValueRow[]) {
    putJson('screenAliases', value);
  },

  get excludedScreens(): string[] {
    return readStrings('excludedScreens', DEFAULT_EXCLUDED_SCREENS);
  },
  set excludedScreens(value: string[]) {
    putJson('excludedScreens', value);
  },

  get inAppDebug(): boolean {
    return readBool('inAppDebug', true);
  },
  set inAppDebug(value: boolean) {
    putBool('inAppDebug', value);
  },

  get inAppRunning(): boolean {
    return readBool('inAppRunning', true);
  },
  set inAppRunning(value: boolean) {
    putBool('inAppRunning', value);
  },

  get profiles(): Profile[] {
    return readProfiles();
  },
  set profiles(value: Profile[]) {
    exampleStore.set(NativeKeys.profiles, encodeProfiles(value));
  },

  get activeProfileId(): string {
    return (
      exampleStore.get(NativeKeys.activeProfileId) ?? readProfiles()[0]!.id
    );
  },
  set activeProfileId(value: string) {
    exampleStore.set(NativeKeys.activeProfileId, value);
  },

  get debugLevel(): LogLevel {
    const value = exampleStore.get(NativeKeys.debugLevel);
    return LOG_LEVELS.find((level) => level === value) ?? 'info';
  },
  set debugLevel(value: LogLevel) {
    exampleStore.set(NativeKeys.debugLevel, value);
  },
};
