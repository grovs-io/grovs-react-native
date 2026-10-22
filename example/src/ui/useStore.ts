import { useCallback, useSyncExternalStore } from 'react';
import type { LogEntry } from '../actions/log';
import { appLog } from '../actions/testLog';
import { exampleStore } from '../store/exampleStore';
import {
  settingsStore,
  type FormKey,
  type SavedForms,
} from '../store/settingsStore';

type LogSnapshot = { entries: LogEntry[]; unseenError: boolean };

let snapshot: LogSnapshot = { entries: [], unseenError: false };

function getSnapshot(): LogSnapshot {
  const entries = appLog.entries();
  const unseenError = appLog.unseenError();
  if (snapshot.entries !== entries || snapshot.unseenError !== unseenError) {
    snapshot = { entries, unseenError };
  }
  return snapshot;
}

const subscribe = (listener: () => void) => appLog.subscribe(listener);

export function useLog(): LogSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot);
}

const formCache: Partial<Record<FormKey, { raw?: string; value: unknown }>> =
  {};

function savedForm<K extends FormKey>(key: K): SavedForms[K] {
  const raw = exampleStore.get(key);
  const cached = formCache[key];
  if (cached && cached.raw === raw) return cached.value as SavedForms[K];
  const value = settingsStore[key];
  formCache[key] = { raw, value };
  return value;
}

/** A saved form shared by every screen that shows it, and its setter. */
export function useSavedForm<K extends FormKey>(
  key: K
): [SavedForms[K], (value: SavedForms[K]) => void] {
  const subscribeToForm = useCallback(
    (listener: () => void) =>
      settingsStore.subscribeForms((changed) => {
        if (changed === key) listener();
      }),
    [key]
  );
  const value = useSyncExternalStore(subscribeToForm, () => savedForm(key));
  const save = useCallback(
    (next: SavedForms[K]) => {
      (settingsStore as SavedForms)[key] = next;
    },
    [key]
  );
  return [value, save];
}
