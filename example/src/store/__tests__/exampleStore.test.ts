const startedProfile = {
  id: 'grovs-test',
  name: 'Grovs test',
  apiKey: 'grovst_key',
  test: true,
  baseUrl: null,
  autoTrack: true,
  startEnabled: true,
  clipboardDomains: [],
};

const mockNative = {
  getAll: jest.fn(),
  set: jest.fn(),
  restart: jest.fn(),
  fetchPushToken: jest.fn(),
  startedProfile: JSON.stringify(startedProfile),
  configureError: null as string | null,
};
const native = mockNative;

jest.mock('react-native', () => ({
  NativeModules: { ExampleStore: mockNative },
}));

function freshStore(): typeof import('../exampleStore').exampleStore {
  let store!: typeof import('../exampleStore').exampleStore;
  jest.isolateModules(() => {
    store = require('../exampleStore').exampleStore;
  });
  return store;
}

beforeEach(() => {
  jest.clearAllMocks();
  native.configureError = null;
  native.getAll.mockResolvedValue({
    debugLevel: 'error',
    activeProfileId: 'grovs-test',
  });
});

describe('exampleStore', () => {
  it('returns undefined before load', () => {
    expect(freshStore().get('debugLevel')).toBeUndefined();
  });

  it('returns stored values after load', async () => {
    const store = freshStore();
    await store.load();
    expect(store.get('debugLevel')).toBe('error');
    expect(store.get('activeProfileId')).toBe('grovs-test');
    expect(store.get('missing')).toBeUndefined();
  });

  it('loads from native once', async () => {
    const store = freshStore();
    await Promise.all([store.load(), store.load()]);
    await store.load();
    expect(native.getAll).toHaveBeenCalledTimes(1);
  });

  it('retries the load after a failure', async () => {
    const store = freshStore();
    native.getAll.mockRejectedValueOnce(new Error('no native'));
    await expect(store.load()).rejects.toThrow('no native');
    await store.load();
    expect(store.get('debugLevel')).toBe('error');
    expect(native.getAll).toHaveBeenCalledTimes(2);
  });

  it('updates the cache and native on set', async () => {
    const store = freshStore();
    await store.load();
    store.set('debugLevel', 'info');
    expect(store.get('debugLevel')).toBe('info');
    expect(native.set).toHaveBeenCalledWith('debugLevel', 'info');
  });

  it('removes a value when set to null', async () => {
    const store = freshStore();
    await store.load();
    store.set('debugLevel', null);
    expect(store.get('debugLevel')).toBeUndefined();
    expect(native.set).toHaveBeenCalledWith('debugLevel', null);
  });

  it('exposes the profile native started with and the configure error', () => {
    native.configureError = 'Enter an API key';
    const store = freshStore();
    expect(store.startedProfile).toEqual(startedProfile);
    expect(store.configureError).toBe('Enter an API key');
  });

  it('forwards restart and fetchPushToken to native', async () => {
    native.fetchPushToken.mockResolvedValue('token');
    const store = freshStore();
    store.restart();
    expect(native.restart).toHaveBeenCalled();
    await expect(store.fetchPushToken()).resolves.toBe('token');
  });

  it('fails soft when the native module is missing', async () => {
    const { NativeModules } = require('react-native');
    const saved = NativeModules.ExampleStore;
    NativeModules.ExampleStore = undefined;
    try {
      const store = freshStore();
      expect(store.available).toBe(false);
      await expect(store.load()).resolves.toBeUndefined();
      expect(() => store.set('debugLevel', 'info')).not.toThrow();
      expect(store.get('debugLevel')).toBe('info');
      expect(store.startedProfile).toBeNull();
      expect(store.configureError).toBeNull();
      expect(() => store.restart()).not.toThrow();
      await expect(store.fetchPushToken()).resolves.toBeNull();
    } finally {
      NativeModules.ExampleStore = saved;
    }
  });

  it('returns null when native has no push token', async () => {
    native.fetchPushToken.mockResolvedValue(undefined);
    await expect(freshStore().fetchPushToken()).resolves.toBeNull();
  });
});
