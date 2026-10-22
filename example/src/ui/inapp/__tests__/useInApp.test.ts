import { act, renderHook } from '@testing-library/react-native';
import Grovs from 'react-native-grovs-wrapper';
import { appLog } from '../../../actions/testLog';
import { settingsStore } from '../../../store/settingsStore';
import { useInApp } from '../useInApp';

const mockValues: Record<string, string> = {};

jest.mock('../../../store/exampleStore', () => ({
  NativeKeys: jest.requireActual('../../../store/exampleStore').NativeKeys,
  exampleStore: {
    get: (key: string) => mockValues[key],
    set: (key: string, value: string | null) => {
      if (value === null) delete mockValues[key];
      else mockValues[key] = value;
    },
  },
}));

jest.mock('react-native-grovs-wrapper', () => ({
  __esModule: true,
  default: {
    track: jest.fn(),
    pauseInAppMessages: jest.fn(),
    resumeInAppMessages: jest.fn(),
    discardInAppMessages: jest.fn(),
    setInAppExcludedScreens: jest.fn(),
    setInAppDebugLogging: jest.fn(),
  },
}));

const grovs = jest.mocked(Grovs);

beforeEach(() => {
  Object.keys(mockValues).forEach((key) => delete mockValues[key]);
  jest.clearAllMocks();
  appLog.clear();
});

describe('useInApp', () => {
  it('starts from the saved settings', () => {
    settingsStore.inAppRunning = false;
    settingsStore.inAppDebug = false;
    const { result } = renderHook(() => useInApp());
    expect(result.current.running).toBe(false);
    expect(result.current.debug).toBe(false);
    expect(result.current.excluded).toEqual(['Excluded']);
    expect(result.current.trigger).toBe('demo_tapped');
  });

  it('pauses and resumes, and saves the state', async () => {
    const { result } = renderHook(() => useInApp());
    await act(async () => result.current.setRunning(false));
    expect(grovs.pauseInAppMessages).toHaveBeenCalledTimes(1);
    expect(settingsStore.inAppRunning).toBe(false);
    expect(result.current.running).toBe(false);
    await act(async () => result.current.setRunning(true));
    expect(grovs.resumeInAppMessages).toHaveBeenCalledTimes(1);
    expect(settingsStore.inAppRunning).toBe(true);
  });

  it('discards waiting messages and switches to paused', async () => {
    const { result } = renderHook(() => useInApp());
    await act(async () => result.current.discard(false));
    expect(grovs.discardInAppMessages).toHaveBeenCalledWith({
      dismissCurrent: false,
    });
    expect(result.current.running).toBe(false);
    expect(settingsStore.inAppRunning).toBe(false);
  });

  it('closes the current message too', async () => {
    const { result } = renderHook(() => useInApp());
    await act(async () => result.current.discard(true));
    expect(grovs.discardInAppMessages).toHaveBeenCalledWith({
      dismissCurrent: true,
    });
  });

  it('applies and saves the excluded screens', async () => {
    const { result } = renderHook(() => useInApp());
    await act(async () => result.current.setExcluded(['Checkout']));
    expect(grovs.setInAppExcludedScreens).toHaveBeenCalledWith(['Checkout']);
    expect(settingsStore.excludedScreens).toEqual(['Checkout']);
    expect(result.current.excluded).toEqual(['Checkout']);
  });

  it('applies and saves debug logging', async () => {
    const { result } = renderHook(() => useInApp());
    await act(async () => result.current.setDebug(false));
    expect(grovs.setInAppDebugLogging).toHaveBeenCalledWith(false);
    expect(settingsStore.inAppDebug).toBe(false);
    expect(result.current.debug).toBe(false);
  });

  it('logs setters as in-app entries that cannot be repeated', async () => {
    const { result } = renderHook(() => useInApp());
    await act(async () => result.current.setDebug(false));
    const entry = appLog.entries()[0]!;
    expect(entry.type).toBe('IN-APP');
    expect(entry.action?.repeatable).toBe(false);
  });

  it('tracks the trigger, saves it and logs a repeatable event', async () => {
    const { result } = renderHook(() => useInApp());
    act(() => result.current.setTrigger('promo_seen'));
    expect(settingsStore.inAppTrigger).toBe('promo_seen');
    await act(async () => result.current.fireTrigger());
    expect(grovs.track).toHaveBeenCalledWith(
      'promo_seen',
      undefined,
      undefined
    );
    const entry = appLog.entries()[0]!;
    expect(entry.type).toBe('EVENT');
    expect(entry.action?.repeatable).not.toBe(false);
  });

  it('does not track a blank trigger', async () => {
    const { result } = renderHook(() => useInApp());
    act(() => result.current.setTrigger('  '));
    await act(async () => result.current.fireTrigger());
    expect(grovs.track).not.toHaveBeenCalled();
  });
});
