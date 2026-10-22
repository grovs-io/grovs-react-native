const mockStore = {
  available: true,
  values: {} as Record<string, string>,
  configureError: null as string | null,
  startedProfile: {
    id: 'grovs-test',
    name: 'Grovs test',
    apiKey:
      'grovst_06e36086dad3e934289560e3ca59527282030868f8c844629516c6e6c67bbf1f',
    test: true,
    baseUrl: null,
    autoTrack: false,
    startEnabled: true,
    clipboardDomains: [],
  },
  load: jest.fn(),
  get: jest.fn((key: string) => mockStore.values[key]),
  set: jest.fn(),
  fetchPushToken: jest.fn(),
};

const listeners: {
  link?: (d: { link?: string; data?: object }) => void;
  inApp?: (e: any) => void;
} = {};

const mockGrovs = {
  setIdentifier: jest.fn(),
  setAttributes: jest.fn(),
  setGlobalTags: jest.fn(),
  setScreenAliases: jest.fn(),
  setInAppExcludedScreens: jest.fn(),
  setInAppDebugLogging: jest.fn(),
  pauseInAppMessages: jest.fn(),
  setDebug: jest.fn(),
};

jest.mock('react-native-grovs-wrapper', () => ({
  __esModule: true,
  default: {
    ...mockGrovs,
    onDeeplinkReceived: (cb: any) => {
      listeners.link = cb;
    },
    onInAppMessage: (cb: any) => {
      listeners.inApp = cb;
    },
  },
}));
jest.mock('../../store/exampleStore', () => ({
  NativeKeys: jest.requireActual('../../store/exampleStore').NativeKeys,
  exampleStore: mockStore,
}));

function start() {
  let mod!: { startLogging: () => void; log: any };
  jest.isolateModules(() => {
    mod = {
      startLogging: require('../startup').startLogging,
      log: require('../testLog').appLog,
    };
  });
  mod.startLogging();
  return mod.log as import('../testLog').TestLog;
}

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  mockStore.values = {};
  mockStore.configureError = null;
  mockStore.available = true;
  Object.values(mockGrovs).forEach((fn) => fn.mockReset());
  mockStore.load.mockReset().mockResolvedValue(undefined);
  mockStore.set.mockReset();
  mockStore.fetchPushToken
    .mockReset()
    .mockResolvedValue('tok_1234567890abcdef');
});

const titles = (log: any) => log.entries().map((e: any) => e.title);

describe('startLogging', () => {
  it('keeps a link opened before load and saves it after load', async () => {
    let finishLoad!: () => void;
    mockStore.load.mockReturnValue(new Promise<void>((r) => (finishLoad = r)));
    mockStore.values.linkHistory = JSON.stringify([
      {
        time: 5,
        title: 'Opened from link',
        detail: 'old',
        code: '',
        link: 'https://grovs.link/old',
      },
    ]);
    const log = start();
    listeners.link!({ link: 'https://grovs.link/cold', data: { a: 1 } });
    expect(
      log.entries().some((e) => e.link === 'https://grovs.link/cold')
    ).toBe(true);
    expect(mockStore.set).not.toHaveBeenCalled();

    finishLoad();
    await flush();
    const [key, json] = mockStore.set.mock.calls.at(-1)!;
    expect(key).toBe('linkHistory');
    expect(JSON.parse(json).map((e: any) => e.link)).toEqual([
      'https://grovs.link/cold',
      'https://grovs.link/old',
    ]);
  });

  it('logs in-app events, failed as error and others ok', () => {
    const log = start();
    listeners.inApp!({ type: 'shown', campaignId: 'c1' });
    listeners.inApp!({ type: 'failed', message: 'nope' });
    const [failed, shown] = log.entries();
    expect(shown).toMatchObject({
      type: 'IN-APP',
      state: 'ok',
      title: 'Shown',
      detail: 'c1',
    });
    expect(failed).toMatchObject({
      state: 'error',
      title: 'Failed',
      detail: 'message: nope',
    });
  });

  it('logs a successful configure', () => {
    const log = start();
    const entry = log.entries().find((e) => e.title === 'SDK configured')!;
    expect(entry.state).toBe('ok');
    expect(entry.detail).toBe('Grovs test · test');
    expect(entry.code).toContain('…');
    expect(entry.code).toContain('useTestEnvironment = true');
    expect(entry.code).toContain('baseURL = null');
    expect(entry.code).toContain('autoTrackScreenViews = false');
    expect(entry.code).toContain('clipboardDomains = []');
    expect(entry.code).toContain('enabled = true');
  });

  it('logs an error when the native module is missing and still restores', async () => {
    mockStore.available = false;
    const log = start();
    await flush();
    expect(log.entries().find((e) => e.state === 'error')).toMatchObject({
      type: 'SDK',
      title: 'Example native module missing, rebuild the app',
    });
    expect(titles(log)).not.toContain('SDK configured');
    expect(mockGrovs.setIdentifier).toHaveBeenCalled();
  });

  it('logs a configure error', () => {
    mockStore.configureError = 'bad key';
    const log = start();
    const entry = log
      .entries()
      .find((e) => e.title === 'SDK configure failed')!;
    expect(entry).toMatchObject({ state: 'error', detail: 'bad key' });
  });

  it('logs the push token', async () => {
    const log = start();
    await flush();
    const entry = log.entries().find((e) => e.type === 'PUSH')!;
    expect(entry).toMatchObject({
      state: 'ok',
      title: 'Push token registered',
    });
    expect(entry.code).toContain('setPushToken');
  });

  it('warns when there is no push token', async () => {
    mockStore.fetchPushToken.mockResolvedValue(null);
    const log = start();
    await flush();
    expect(log.entries()[0]).toMatchObject({
      state: 'warning',
      title: 'No push token yet',
    });
  });

  it('warns when the push token fails', async () => {
    mockStore.fetchPushToken.mockRejectedValue(new Error('denied'));
    const log = start();
    await flush();
    expect(log.entries()[0]).toMatchObject({
      state: 'warning',
      title: 'Push token failed',
      detail: 'denied',
    });
    expect(titles(log)).toContain('SDK configured');
  });

  it('logs an SDK error when restoring fails', async () => {
    mockStore.set.mockImplementation(() => {
      throw new Error('disk full');
    });
    const log = start();
    await flush();
    expect(
      log.entries().some((e) => e.type === 'SDK' && e.state === 'error')
    ).toBe(true);
  });

  it('survives an empty in-app event type', () => {
    const log = start();
    expect(() => listeners.inApp!({ type: '', campaignId: 'c' })).not.toThrow();
    expect(log.entries()[0]?.type).toBe('IN-APP');
  });

  it('applies the default settings on first launch', async () => {
    start();
    await flush();
    expect(mockGrovs.setIdentifier).toHaveBeenCalledWith('React native id');
    expect(mockGrovs.setGlobalTags).toHaveBeenCalledWith(undefined);
    expect(mockGrovs.setScreenAliases).toHaveBeenCalledWith({
      Home: 'Home screen',
    });
    expect(mockGrovs.setInAppExcludedScreens).toHaveBeenCalledWith([
      'Excluded',
    ]);
    expect(mockGrovs.setInAppDebugLogging).toHaveBeenCalledWith(true);
    expect(mockGrovs.pauseInAppMessages).not.toHaveBeenCalled();
    expect(mockGrovs.setDebug).toHaveBeenCalledWith('info');
  });

  it('applies saved settings once the store has loaded', async () => {
    let finishLoad!: () => void;
    mockStore.load.mockReturnValue(new Promise<void>((r) => (finishLoad = r)));
    mockStore.values = {
      identity: JSON.stringify({
        identifier: '',
        attributes: [{ key: 'plan', value: 'pro', type: 'text' }],
      }),
      globalTags: JSON.stringify(['beta']),
      screenAliases: JSON.stringify([
        { key: 'Checkout', value: 'Pay', type: 'text' },
      ]),
      excludedScreens: JSON.stringify([]),
      inAppDebug: 'false',
      inAppRunning: 'false',
      debugLevel: 'error',
    };
    start();
    expect(mockGrovs.setIdentifier).not.toHaveBeenCalled();
    finishLoad();
    await flush();
    expect(mockGrovs.setIdentifier).toHaveBeenCalledWith(undefined);
    expect(mockGrovs.setAttributes).toHaveBeenCalledWith({ plan: 'pro' });
    expect(mockGrovs.setGlobalTags).toHaveBeenCalledWith(['beta']);
    expect(mockGrovs.setScreenAliases).toHaveBeenCalledWith({
      Checkout: 'Pay',
    });
    expect(mockGrovs.setInAppExcludedScreens).toHaveBeenCalledWith([]);
    expect(mockGrovs.setInAppDebugLogging).toHaveBeenCalledWith(false);
    expect(mockGrovs.pauseInAppMessages).toHaveBeenCalledTimes(1);
    expect(mockGrovs.setDebug).toHaveBeenCalledWith('error');
  });

  it('logs an error when saved settings cannot be applied and still logs the push token', async () => {
    mockGrovs.setIdentifier.mockImplementation(() => {
      throw new Error('not linked');
    });
    const log = start();
    await flush();
    expect(titles(log)).toContain('Saved settings not applied');
    expect(log.entries().some((e) => e.type === 'PUSH')).toBe(true);
  });
});
