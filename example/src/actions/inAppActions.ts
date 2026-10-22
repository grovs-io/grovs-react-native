import Grovs from 'react-native-grovs-wrapper';
import { callCode } from './callCode';
import type { TestAction } from './log';

export function buildSetRunning(running: boolean): TestAction {
  return {
    type: 'IN-APP',
    title: running ? 'Resume messages' : 'Pause messages',
    code: callCode(running ? 'resumeInAppMessages' : 'pauseInAppMessages', []),
    repeatable: false,
    run: async () => {
      if (running) Grovs.resumeInAppMessages();
      else Grovs.pauseInAppMessages();
      return { state: 'ok', detail: running ? 'running' : 'paused' };
    },
  };
}

/** Discarding also leaves the SDK paused. */
export function buildDiscard(dismissCurrent: boolean): TestAction {
  return {
    type: 'IN-APP',
    title: dismissCurrent
      ? 'Close current message'
      : 'Discard waiting messages',
    code: callCode('discardInAppMessages', [
      ['dismissCurrent', dismissCurrent],
    ]),
    repeatable: false,
    run: async () => {
      Grovs.discardInAppMessages({ dismissCurrent });
      return { state: 'ok', detail: 'paused' };
    },
  };
}

export function buildSetExcluded(screens: string[]): TestAction {
  return {
    type: 'IN-APP',
    title: 'Excluded screens set',
    code: callCode('setInAppExcludedScreens', [['screens', screens]]),
    repeatable: false,
    run: async () => {
      Grovs.setInAppExcludedScreens(screens);
      return { state: 'ok', detail: screens.join(', ') || 'none' };
    },
  };
}

export function buildSetDebug(enabled: boolean): TestAction {
  return {
    type: 'IN-APP',
    title: `Debug logging ${enabled ? 'on' : 'off'}`,
    code: callCode('setInAppDebugLogging', [['enabled', enabled]]),
    repeatable: false,
    run: async () => {
      Grovs.setInAppDebugLogging(enabled);
      return { state: 'ok', detail: 'applied' };
    },
  };
}
