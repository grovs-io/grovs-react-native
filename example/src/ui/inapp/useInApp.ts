import { useState } from 'react';
import {
  buildDiscard,
  buildSetDebug,
  buildSetExcluded,
  buildSetRunning,
} from '../../actions/inAppActions';
import { buildTrack } from '../../actions/eventActions';
import type { TestAction } from '../../actions/log';
import { appLog } from '../../actions/testLog';
import { runAction } from '../../actions/testRunner';
import { settingsStore } from '../../store/settingsStore';

const run = (action: TestAction) => runAction(appLog, action);

export const isExcluded = (screens: string[], name: string) =>
  screens.some((screen) => screen.toLowerCase() === name.toLowerCase());

/** Fires the saved trigger, the same way from the tab and from the excluded screen. */
export const fireSavedTrigger = () => {
  const name = settingsStore.inAppTrigger.trim();
  if (name === '') return;
  run(buildTrack({ name, properties: [], tags: [] }));
};

/** In-app message controls, each applied to the SDK and saved as it changes. */
export function useInApp() {
  const [running, setRunningState] = useState(() => settingsStore.inAppRunning);
  const [debug, setDebugState] = useState(() => settingsStore.inAppDebug);
  const [excluded, setExcludedState] = useState(
    () => settingsStore.excludedScreens
  );
  const [trigger, setTriggerState] = useState(() => settingsStore.inAppTrigger);

  const saveRunning = (value: boolean) => {
    setRunningState(value);
    settingsStore.inAppRunning = value;
  };

  return {
    running,
    setRunning: (value: boolean) => {
      saveRunning(value);
      run(buildSetRunning(value));
    },
    discard: (dismissCurrent: boolean) => {
      saveRunning(false);
      run(buildDiscard(dismissCurrent));
    },
    debug,
    setDebug: (value: boolean) => {
      setDebugState(value);
      settingsStore.inAppDebug = value;
      run(buildSetDebug(value));
    },
    excluded,
    setExcluded: (screens: string[]) => {
      setExcludedState(screens);
      settingsStore.excludedScreens = screens;
      run(buildSetExcluded(screens));
    },
    trigger,
    setTrigger: (value: string) => {
      setTriggerState(value);
      settingsStore.inAppTrigger = value;
    },
    fireTrigger: fireSavedTrigger,
  };
}
