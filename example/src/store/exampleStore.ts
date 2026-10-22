import { NativeModules } from 'react-native';

/** Settings read by native `Grovs.configure` at launch. Same JSON shape on both platforms. */
export type Profile = {
  id: string;
  name: string;
  apiKey: string;
  test: boolean;
  baseUrl: string | null;
  autoTrack: boolean;
  startEnabled: boolean;
  clipboardDomains: string[];
};

/** Keys native reads before React Native starts. */
export const NativeKeys = {
  profiles: 'profiles',
  activeProfileId: 'activeProfileId',
  debugLevel: 'debugLevel',
  pushToken: 'pushToken',
} as const;

type NativeExampleStore = {
  getAll(): Promise<Record<string, string>>;
  set(key: string, value: string | null): void;
  restart(): void;
  fetchPushToken(): Promise<string | null>;
  startedProfile: string;
  configureError: string | null;
};

const native = (): NativeExampleStore => NativeModules.ExampleStore;

class ExampleStore {
  private values: Record<string, string> = {};

  async load(): Promise<void> {
    this.values = { ...(await native().getAll()) };
  }

  get(key: string): string | undefined {
    return this.values[key];
  }

  set(key: string, value: string | null): void {
    if (value === null) {
      delete this.values[key];
    } else {
      this.values[key] = value;
    }
    native().set(key, value);
  }

  get startedProfile(): Profile {
    return JSON.parse(native().startedProfile);
  }

  get configureError(): string | null {
    return native().configureError ?? null;
  }

  restart(): void {
    native().restart();
  }

  async fetchPushToken(): Promise<string | null> {
    return (await native().fetchPushToken()) ?? null;
  }
}

export const exampleStore = new ExampleStore();
