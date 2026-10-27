import { isWebUrl } from './linkTools';

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

/** Stands in for the native default profile in a stale build without the native module. */
export const MISSING_NATIVE_PROFILE: Profile = {
  id: 'missing-native',
  name: 'Rebuild the app',
  apiKey: '',
  test: true,
  baseUrl: null,
  autoTrack: false,
  startEnabled: true,
  clipboardDomains: [],
};

export const profileNameError = (name: string): string | null =>
  name.trim() === '' ? 'Enter a name' : null;

export const apiKeyError = (key: string): string | null =>
  key.trim() === '' ? 'Enter an API key' : null;

/** A blank base URL means the SDK default. */
export const baseUrlError = (url: string): string | null =>
  url.trim() !== '' && !isWebUrl(url)
    ? 'Must start with http:// or https://'
    : null;

const sameList = (a: string[], b: string[]) =>
  a.length === b.length && a.every((item, i) => item === b[i]);

export function restartChanges(started: Profile, current: Profile): string[] {
  if (started.id !== current.id) return ['Project'];
  const changes: string[] = [];
  if (started.apiKey !== current.apiKey) changes.push('API key');
  if (started.test !== current.test) changes.push('Environment');
  if (started.baseUrl !== current.baseUrl) changes.push('Base URL');
  if (!sameList(started.clipboardDomains, current.clipboardDomains)) {
    changes.push('Clipboard domains');
  }
  if (started.autoTrack !== current.autoTrack)
    changes.push('Auto track screens');
  if (started.startEnabled !== current.startEnabled) {
    changes.push('Start with SDK enabled');
  }
  return changes;
}

export function encodeProfiles(profiles: Profile[]): string {
  return JSON.stringify(
    profiles.map((p) => ({
      id: p.id,
      name: p.name,
      apiKey: p.apiKey,
      test: p.test,
      baseUrl: p.baseUrl === null || p.baseUrl.trim() === '' ? null : p.baseUrl,
      autoTrack: p.autoTrack,
      startEnabled: p.startEnabled,
      clipboardDomains: p.clipboardDomains,
    }))
  );
}

export function decodeProfiles(json: string): Profile[] {
  const parsed: Array<Record<string, any>> = JSON.parse(json);
  return parsed.map((o) => ({
    id: o.id,
    name: o.name,
    apiKey: o.apiKey,
    test: o.test,
    baseUrl: o.baseUrl ?? null,
    autoTrack: o.autoTrack ?? true,
    startEnabled: o.startEnabled ?? true,
    clipboardDomains: o.clipboardDomains ?? [],
  }));
}
