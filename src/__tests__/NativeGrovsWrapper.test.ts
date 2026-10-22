export {};

const mockMarkReadyForInAppEvents = jest.fn();
const mockLinkDetails = jest.fn();
const mockRemove = jest.fn();
const mockEmitterAddListener = jest.fn(
  (_event: string, _callback: (raw: unknown) => void) => ({
    remove: mockRemove,
  })
);

jest.mock('react-native', () => ({
  NativeModules: {},
  TurboModuleRegistry: {
    get: () => ({
      markReadyForInAppEvents: mockMarkReadyForInAppEvents,
      linkDetails: mockLinkDetails,
    }),
  },
  NativeEventEmitter: jest.fn(() => ({
    addListener: mockEmitterAddListener,
  })),
  Platform: { OS: 'ios', select: (obj: any) => obj.ios },
}));

(global as any).RN$Bridgeless = true;

let Grovs: typeof import('../index').default;

beforeAll(() => {
  Grovs = require('../index').default;
});

afterAll(() => {
  (global as any).RN$Bridgeless = false;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TurboModuleGrovs.onInAppMessage', () => {
  it('subscribes to onGrovsInAppMessage and marks the module ready', () => {
    Grovs.onInAppMessage(jest.fn());

    expect(mockEmitterAddListener).toHaveBeenCalledWith(
      'onGrovsInAppMessage',
      expect.any(Function)
    );
    expect(mockMarkReadyForInAppEvents).toHaveBeenCalledTimes(1);
  });

  it('delivers normalized events and skips invalid ones', () => {
    const callback = jest.fn();
    Grovs.onInAppMessage(callback);
    const listener = mockEmitterAddListener.mock.calls[0]![1];

    listener({ type: 'clicked', campaignId: 'c1', buttonId: null });
    listener({ type: 'shown' });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({
      type: 'clicked',
      campaignId: 'c1',
    });
  });

  it('removes the native subscription', () => {
    const subscription = Grovs.onInAppMessage(jest.fn());
    subscription.remove();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});

describe('TurboModuleGrovs.linkDetails', () => {
  it('passes the path to the native module and returns its result', async () => {
    const details = { path: 'abc123', title: 'Title' };
    mockLinkDetails.mockResolvedValue(details);

    await expect(Grovs.linkDetails('abc123')).resolves.toEqual(details);
    expect(mockLinkDetails).toHaveBeenCalledWith('abc123');
  });
});
