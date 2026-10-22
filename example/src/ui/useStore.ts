import { useSyncExternalStore } from 'react';
import type { LogEntry } from '../actions/log';
import { appLog } from '../actions/testLog';

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
