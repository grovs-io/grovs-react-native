import { act, renderHook } from '@testing-library/react-native';
import Grovs from 'react-native-grovs-wrapper';
import { DEFAULT_PROFILES, type Profile } from '../../../data/profile';
import { exampleStore } from '../../../store/exampleStore';
import { settingsStore } from '../../../store/settingsStore';
import { useSettings } from '../useSettings';

const mockValues: Record<string, string> = {};
const mockStarted: { profile: Profile } = { profile: DEFAULT_PROFILES[0]! };

jest.mock('../../../store/exampleStore', () => ({
  NativeKeys: jest.requireActual('../../../store/exampleStore').NativeKeys,
  exampleStore: {
    get: (key: string) => mockValues[key],
    set: (key: string, value: string | null) => {
      if (value === null) delete mockValues[key];
      else mockValues[key] = value;
    },
    get startedProfile() {
      return mockStarted.profile;
    },
    restart: jest.fn(),
  },
}));

jest.mock('react-native-grovs-wrapper', () => ({
  __esModule: true,
  default: { setDebug: jest.fn() },
}));

const started = DEFAULT_PROFILES[0]!;

beforeEach(() => {
  Object.keys(mockValues).forEach((key) => delete mockValues[key]);
  mockStarted.profile = started;
  jest.clearAllMocks();
});

describe('useSettings', () => {
  it('starts on the active profile with no restart needed', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.profile).toEqual(started);
    expect(result.current.restart).toBeNull();
  });

  it('+ New copies the current profile with a new id and selects it', () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.addProfile());
    const { profile, profiles } = result.current;
    expect(profiles).toHaveLength(2);
    expect(profile.id).not.toBe(started.id);
    expect(profile.name).toBe('Grovs test copy');
    expect(profile.apiKey).toBe(started.apiKey);
    expect(settingsStore.profiles).toEqual(profiles);
    expect(settingsStore.activeProfileId).toBe(profile.id);
    expect(result.current.restart?.changes).toEqual(['Project']);
  });

  it('editing the key shows the restart bar and saves it', () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.update({ apiKey: 'grovst_other' }));
    expect(result.current.restart).toEqual({
      changes: ['API key'],
      blockedBy: null,
    });
    expect(settingsStore.profiles[0]!.apiKey).toBe('grovst_other');
  });

  it('changing the key back hides the bar', () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.update({ apiKey: 'grovst_other' }));
    act(() => result.current.update({ apiKey: started.apiKey }));
    expect(result.current.restart).toBeNull();
  });

  it('a blank key blocks Restart and is not saved', () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.update({ apiKey: ' ' }));
    expect(result.current.errors.apiKey).toBe('Enter an API key');
    expect(result.current.restart).toEqual({
      changes: ['API key'],
      blockedBy: 'Enter an API key',
    });
    expect(settingsStore.profiles[0]!.apiKey).toBe(started.apiKey);
    act(() => result.current.restartNow());
    expect(exampleStore.restart).not.toHaveBeenCalled();
  });

  it('a bad base URL shows its error', () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.update({ baseUrl: 'staging.grovs.io' }));
    expect(result.current.errors.baseUrl).toBe(
      'Must start with http:// or https://'
    );
    expect(result.current.restart?.blockedBy).toBe(
      'Must start with http:// or https://'
    );
  });

  it('a cleared base URL is the SDK default, not a change', () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.update({ baseUrl: 'https://staging.grovs.io' }));
    expect(result.current.restart?.changes).toEqual(['Base URL']);
    act(() => result.current.update({ baseUrl: '' }));
    expect(result.current.restart).toBeNull();
  });

  it('switching profile changes the active id and asks for a restart', () => {
    const other = { ...started, id: 'other', name: 'Other' };
    settingsStore.profiles = [started, other];
    const { result } = renderHook(() => useSettings());
    act(() => result.current.select('other'));
    expect(result.current.profile.name).toBe('Other');
    expect(settingsStore.activeProfileId).toBe('other');
    expect(result.current.restart?.changes).toEqual(['Project']);
  });

  it('deletes the active profile and selects the first one left', () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.addProfile());
    act(() => result.current.deleteActive());
    expect(result.current.profiles).toEqual([started]);
    expect(settingsStore.activeProfileId).toBe(started.id);
    expect(result.current.restart).toBeNull();
  });

  it('restart saves, then restarts after a notice', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useSettings());
    act(() => result.current.update({ test: false }));
    act(() => result.current.restartNow());
    expect(result.current.restartNotice).toBe('Close and reopen the app');
    expect(settingsStore.profiles[0]!.test).toBe(false);
    expect(exampleStore.restart).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1500));
    expect(exampleStore.restart).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('applies the debug level right away and saves it', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.debugLevel).toBe('info');
    act(() => result.current.setDebugLevel('error'));
    expect(Grovs.setDebug).toHaveBeenCalledWith('error');
    expect(settingsStore.debugLevel).toBe('error');
    expect(result.current.debugLevel).toBe('error');
  });
});
