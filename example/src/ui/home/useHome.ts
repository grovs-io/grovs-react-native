import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, PermissionsAndroid, Platform } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Grovs from 'react-native-grovs-wrapper';
import { callCode } from '../../actions/callCode';
import { buildPurchase, buildTrack } from '../../actions/eventActions';
import { buildGenerateLink } from '../../actions/linkActions';
import type { LogEntry, TestAction } from '../../actions/log';
import { appLog } from '../../actions/testLog';
import { runAction } from '../../actions/testRunner';
import { eventNameError, tagsError } from '../../data/eventRules';
import {
  isPurchaseValid,
  linkFormError,
  purchaseLabel,
  type EventForm,
  type PurchaseForm,
} from '../../data/forms';
import type { KeyValueRow } from '../../data/keyValue';
import { toValueMap } from '../../data/keyValue';
import { isWebUrl } from '../../data/linkTools';
import type { Profile } from '../../data/profile';
import { relativeTime } from '../../data/strings';
import { exampleStore, NativeKeys } from '../../store/exampleStore';
import { settingsStore, type Identity } from '../../store/settingsStore';
import { showToast } from '../controls/Toast';
import { useLog, useSavedForm } from '../useStore';

const TICK_MS = 30_000;

export function startedProfile(): Profile | null {
  try {
    return exampleStore.startedProfile;
  } catch {
    return null;
  }
}

type DeviceConstants = { Brand?: string; Model?: string };

export function deviceName(): string {
  const { Brand, Model } = Platform.constants as DeviceConstants;
  return [Brand, Model].filter(Boolean).join(' ') || 'RN device';
}

export function randomId(): string {
  const hex = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `user_${hex}`;
}

export const keysSummary = (rows: KeyValueRow[]): string =>
  rows
    .map((row) => row.key.trim())
    .filter((key) => key !== '')
    .join(', ');

const run = (action: TestAction) => runAction(appLog, action);

function setSdkAction(on: boolean): TestAction {
  return {
    type: 'SDK',
    title: on ? 'SDK enabled' : 'SDK disabled',
    code: callCode('setSDK', [['enabled', on]]),
    repeatable: false,
    run: async () => {
      Grovs.setSDK(on);
      return { state: 'ok', detail: on ? 'sending' : 'holding events' };
    },
  };
}

function identityAction({ identifier, attributes }: Identity): TestAction {
  const values = toValueMap(attributes);
  return {
    type: 'SDK',
    title: 'Identity saved',
    code: [
      callCode('setIdentifier', [['identifier', identifier || null]]),
      callCode('setAttributes', [['attributes', values]]),
    ].join('\n'),
    repeatable: false,
    run: async () => {
      Grovs.setIdentifier(identifier || undefined);
      Grovs.setAttributes(values);
      return { state: 'ok', detail: identifier || 'no identifier' };
    },
  };
}

function openLinkAction(url: string): TestAction {
  return {
    type: 'LINK',
    title: 'Open clipboard link',
    code: callCode('Linking.openURL', [['url', url]]),
    run: async () => {
      await Linking.openURL(url);
      return { state: 'ok', detail: url };
    },
  };
}

/** SDK switch, identity and quick actions, all kept in the settings store. */
export function useHome() {
  const [sdkEnabled, setSdkState] = useState(
    () => startedProfile()?.startEnabled !== false && settingsStore.sdkEnabled
  );
  const [identity, setIdentity] = useState(() => settingsStore.identity);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(identity);
  const [linkForm, saveLinkForm] = useSavedForm('linkForm');
  const [eventForm, setEventForm] = useState(() => settingsStore.eventForm);
  const [purchaseForm, setPurchaseForm] = useState(
    () => settingsStore.purchaseForm
  );
  const [generating, setGenerating] = useState(false);

  const setSdkEnabled = (on: boolean) => {
    setSdkState(on);
    settingsStore.sdkEnabled = on;
    run(setSdkAction(on));
  };

  const startEditing = () => {
    setDraft(identity);
    setEditing(true);
  };

  const saveIdentity = () => {
    setIdentity(draft);
    settingsStore.identity = draft;
    setEditing(false);
    run(identityAction(draft));
  };

  const saveEventForm = (form: EventForm) => {
    setEventForm(form);
    settingsStore.eventForm = form;
  };
  const savePurchaseForm = (form: PurchaseForm) => {
    setPurchaseForm(form);
    settingsStore.purchaseForm = form;
  };

  const generate = (form = linkForm) => {
    setGenerating(true);
    run(buildGenerateLink(form)).finally(() => setGenerating(false));
  };
  const track = (form = eventForm, force = false) =>
    run(buildTrack(form, force));
  const purchase = (form = purchaseForm) => run(buildPurchase(form));

  const openClipboard = async () => {
    const text = (await Clipboard.getString()).trim();
    if (!isWebUrl(text)) {
      showToast('Clipboard has no link');
      return;
    }
    run(openLinkAction(text));
  };

  return {
    sdkEnabled,
    setSdkEnabled,
    identity,
    attributesSummary: keysSummary(identity.attributes),
    editing,
    draft,
    setDraft,
    startEditing,
    cancelEditing: () => setEditing(false),
    saveIdentity,
    linkForm,
    eventForm,
    purchaseForm,
    saveLinkForm,
    saveEventForm,
    savePurchaseForm,
    generating,
    generate,
    track,
    purchase,
    openClipboard,
    generateError: linkFormError(linkForm),
    trackError: eventNameError(eventForm.name) ?? tagsError(eventForm.tags),
    purchaseValid: isPurchaseValid(purchaseForm),
    labels: {
      generate: 'Generate link',
      clipboard: 'Open clipboard',
      track: `Track ${eventForm.name.trim() || 'event'}`,
      purchase: purchaseLabel(purchaseForm),
    },
  };
}

/** The token native saved, refreshed from native on mount and on demand. */
export function usePushToken(): [string | null, () => void] {
  const [token, setToken] = useState(
    () => exampleStore.get(NativeKeys.pushToken) ?? null
  );
  const refresh = useCallback(() => {
    Promise.resolve()
      .then(() => exampleStore.fetchPushToken())
      .then((fresh) => fresh && setToken(fresh))
      .catch(() => undefined);
  }, []);
  useEffect(refresh, [refresh]);
  return [token, refresh];
}

const ASKS_PERMISSION =
  Platform.OS === 'android' && Number(Platform.Version) >= 33;

/**
 * `allowed` is null where JS cannot read the permission (iOS, Android before 13);
 * there `allow` opens the system settings.
 */
export function useNotifications(onGranted: () => void) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const check = useCallback(() => {
    if (!ASKS_PERMISSION) return;
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
      .then(setAllowed)
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, [check]);

  const allow = async () => {
    if (!ASKS_PERMISSION) {
      Linking.openSettings();
      return;
    }
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    setAllowed(result === 'granted');
    if (result === 'granted') onGranted();
    if (result === 'never_ask_again') Linking.openSettings();
  };
  return { allowed, allow };
}

/** The newest link open and how long ago it was, refreshed every 30 s. */
export function useLatestLink(): { entry: LogEntry; ago: string } | null {
  const { entries } = useLog();
  const entry = entries.find((e) => e.type === 'LINK' && e.link);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [entry?.id]);
  return entry ? { entry, ago: relativeTime(now - entry.time) } : null;
}
