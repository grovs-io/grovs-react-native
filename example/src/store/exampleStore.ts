import { NativeModules } from 'react-native';
import type { Profile } from '../data/profile';

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
  defaultProfile: string;
  configureError: string | null;
};

const native = (): NativeExampleStore | undefined => NativeModules.ExampleStore;

function parseProfile(json: string | undefined): Profile | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

class ExampleStore {
  private values: Record<string, string> = {};
  private loaded?: Promise<void>;
  private canWrite = false;

  /** False in a stale native build; the store then stays empty and ignores writes. */
  get available(): boolean {
    return native() !== undefined;
  }

  /**
   * Reads native once; later calls wait for the same read. A failed read is retried on the next call.
   * Until a read succeeds, writes stay in memory so defaults never replace what native has saved.
   */
  load(): Promise<void> {
    const module = native();
    if (!module) return Promise.resolve();
    this.loaded ??= module.getAll().then(
      (all) => {
        this.values = { ...all };
        this.canWrite = true;
      },
      (error) => {
        this.loaded = undefined;
        throw error;
      }
    );
    return this.loaded;
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
    if (this.canWrite) native()?.set(key, value);
  }

  get startedProfile(): Profile | null {
    return parseProfile(native()?.startedProfile);
  }

  /** The built-in profile native falls back to. */
  get defaultProfile(): Profile | null {
    return parseProfile(native()?.defaultProfile);
  }

  get configureError(): string | null {
    return native()?.configureError ?? null;
  }

  restart(): void {
    native()?.restart();
  }

  async fetchPushToken(): Promise<string | null> {
    return (await native()?.fetchPushToken()) ?? null;
  }
}

export const exampleStore = new ExampleStore();
