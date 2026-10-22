import { DEFAULT_PROFILES } from '../../data/profile';
import { DEFAULT_PURCHASE_FORM } from '../../data/forms';
import {
  DEFAULT_EXCLUDED_SCREENS,
  DEFAULT_IDENTITY,
  settingsStore,
} from '../settingsStore';

const mockValues: Record<string, string> = {};

jest.mock('../exampleStore', () => ({
  NativeKeys: jest.requireActual('../exampleStore').NativeKeys,
  exampleStore: {
    get: (key: string) => mockValues[key],
    set: (key: string, value: string | null) => {
      if (value === null) delete mockValues[key];
      else mockValues[key] = value;
    },
  },
}));

beforeEach(() => {
  Object.keys(mockValues).forEach((key) => delete mockValues[key]);
});

describe('settingsStore', () => {
  it('has defaults before anything is saved', () => {
    expect(settingsStore.identity).toEqual(DEFAULT_IDENTITY);
    expect(settingsStore.sdkEnabled).toBe(true);
    expect(settingsStore.purchaseForm).toEqual(DEFAULT_PURCHASE_FORM);
    expect(settingsStore.globalTags).toEqual([]);
    expect(settingsStore.screenAliases).toEqual([]);
    expect(settingsStore.excludedScreens).toEqual(DEFAULT_EXCLUDED_SCREENS);
    expect(settingsStore.inAppDebug).toBe(true);
    expect(settingsStore.inAppRunning).toBe(true);
    expect(settingsStore.profiles).toEqual(DEFAULT_PROFILES);
    expect(settingsStore.activeProfileId).toBe('grovs-test');
    expect(settingsStore.debugLevel).toBe('info');
  });

  it('keeps what was saved', () => {
    const identity = {
      identifier: 'qa_user_1',
      attributes: [{ key: 'plan', value: 'pro', type: 'text' as const }],
    };
    settingsStore.identity = identity;
    settingsStore.sdkEnabled = false;
    settingsStore.globalTags = ['beta'];
    settingsStore.excludedScreens = [];
    settingsStore.inAppRunning = false;
    settingsStore.debugLevel = 'error';
    expect(settingsStore.identity).toEqual(identity);
    expect(settingsStore.sdkEnabled).toBe(false);
    expect(settingsStore.globalTags).toEqual(['beta']);
    expect(settingsStore.excludedScreens).toEqual([]);
    expect(settingsStore.inAppRunning).toBe(false);
    expect(settingsStore.debugLevel).toBe('error');
    expect(mockValues.debugLevel).toBe('error');
  });

  it('falls back to defaults when stored values are broken', () => {
    mockValues.identity = '{nope';
    mockValues.globalTags = '{"a":1}';
    mockValues.debugLevel = 'loud';
    mockValues.profiles = '[]';
    expect(settingsStore.identity).toEqual(DEFAULT_IDENTITY);
    expect(settingsStore.globalTags).toEqual([]);
    expect(settingsStore.debugLevel).toBe('info');
    expect(settingsStore.profiles).toEqual(DEFAULT_PROFILES);
  });

  it('keeps an identity with no identifier', () => {
    settingsStore.identity = { identifier: '', attributes: [] };
    expect(settingsStore.identity).toEqual({ identifier: '', attributes: [] });
  });
});
