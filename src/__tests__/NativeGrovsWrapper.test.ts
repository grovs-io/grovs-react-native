export {};

const mockMarkReadyToHandleDeeplinks = jest.fn();

jest.mock('react-native', () => ({
  NativeModules: {},
  TurboModuleRegistry: {
    get: () => ({
      markReadyToHandleDeeplinks: mockMarkReadyToHandleDeeplinks,
    }),
  },
  NativeEventEmitter: jest.fn(() => ({
    addListener: jest.fn(() => ({ remove: jest.fn() })),
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

describe('TurboModuleGrovs.markReadyToHandleDeeplinks', () => {
  it('forwards the call to the native module', () => {
    Grovs.markReadyToHandleDeeplinks();

    expect(mockMarkReadyToHandleDeeplinks).toHaveBeenCalledTimes(1);
  });
});
