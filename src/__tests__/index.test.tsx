const mockSetIdentifier = jest.fn();
const mockSetPushToken = jest.fn();
const mockSetAttributes = jest.fn();
const mockSetSDK = jest.fn();
const mockSetDebug = jest.fn();
const mockGenerateLink = jest.fn();
const mockDisplayMessages = jest.fn();
const mockNumberOfUnreadMessages = jest.fn();
const mockMarkReadyToHandleDeeplinks = jest.fn();
const mockLogInAppPurchase = jest.fn();
const mockLogCustomPurchase = jest.fn();
const mockTrack = jest.fn();
const mockTrackScreenView = jest.fn();
const mockSetGlobalTags = jest.fn();
const mockSetScreenAliases = jest.fn();
const mockAddListener = jest.fn(() => ({ remove: jest.fn() }));

jest.mock('react-native', () => {
  const addListenerMock = jest.fn(
    (_event: string, callback: (data: unknown) => void) => {
      // Store callback so we can trigger it in tests
      (addListenerMock as any).__lastCallback = callback;
      return { remove: jest.fn() };
    }
  );

  return {
    NativeModules: {
      GrovsWrapper: {
        setIdentifier: mockSetIdentifier,
        setPushToken: mockSetPushToken,
        setAttributes: mockSetAttributes,
        setSDK: mockSetSDK,
        setDebug: mockSetDebug,
        generateLink: mockGenerateLink,
        displayMessages: mockDisplayMessages,
        numberOfUnreadMessages: mockNumberOfUnreadMessages,
        markReadyToHandleDeeplinks: mockMarkReadyToHandleDeeplinks,
        logInAppPurchase: mockLogInAppPurchase,
        logCustomPurchase: mockLogCustomPurchase,
        track: mockTrack,
        trackScreenView: mockTrackScreenView,
        setGlobalTags: mockSetGlobalTags,
        setScreenAliases: mockSetScreenAliases,
        addListener: mockAddListener,
        removeListeners: jest.fn(),
      },
    },
    TurboModuleRegistry: {
      get: () => ({ generateLink: mockGenerateLink }),
    },
    NativeEventEmitter: jest.fn(() => ({
      addListener: addListenerMock,
    })),
    Platform: { OS: 'ios', select: (obj: any) => obj.ios },
  };
});

// Ensure legacy bridge path (not turbo)
(global as any).RN$Bridgeless = false;

// Must import after mocks are set up
let Grovs: typeof import('../../src/index').default;
let GrovsWrapper: typeof import('../../src/index').GrovsWrapper;

beforeAll(() => {
  const mod = require('../index');
  Grovs = mod.default;
  GrovsWrapper = mod.GrovsWrapper;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GrovsWrapper', () => {
  describe('exports', () => {
    it('exports a default singleton instance', () => {
      expect(Grovs).toBeDefined();
    });

    it('exports the GrovsWrapper class', () => {
      expect(GrovsWrapper).toBeDefined();
    });
  });

  describe('setIdentifier', () => {
    it('forwards identifier to native module', () => {
      Grovs.setIdentifier('user-123');
      expect(mockSetIdentifier).toHaveBeenCalledWith('user-123');
    });

    it('forwards undefined when no identifier provided', () => {
      Grovs.setIdentifier();
      expect(mockSetIdentifier).toHaveBeenCalledWith(undefined);
    });
  });

  describe('setPushToken', () => {
    it('forwards push token to native module', () => {
      Grovs.setPushToken('fcm-token-abc');
      expect(mockSetPushToken).toHaveBeenCalledWith('fcm-token-abc');
    });

    it('forwards undefined when no token provided', () => {
      Grovs.setPushToken();
      expect(mockSetPushToken).toHaveBeenCalledWith(undefined);
    });
  });

  describe('setAttributes', () => {
    it('forwards attributes to native module', () => {
      const attrs = { name: 'John', age: 30, premium: true };
      Grovs.setAttributes(attrs);
      expect(mockSetAttributes).toHaveBeenCalledWith(attrs);
    });

    it('handles array values in attributes', () => {
      const attrs = { tags: ['a', 'b', 'c'] };
      Grovs.setAttributes(attrs);
      expect(mockSetAttributes).toHaveBeenCalledWith(attrs);
    });

    it('forwards undefined when no attributes provided', () => {
      Grovs.setAttributes();
      expect(mockSetAttributes).toHaveBeenCalledWith(undefined);
    });
  });

  describe('setSDK', () => {
    it('enables SDK', () => {
      Grovs.setSDK(true);
      expect(mockSetSDK).toHaveBeenCalledWith(true);
    });

    it('disables SDK', () => {
      Grovs.setSDK(false);
      expect(mockSetSDK).toHaveBeenCalledWith(false);
    });
  });

  describe('setDebug', () => {
    it('sets info log level', () => {
      Grovs.setDebug('info');
      expect(mockSetDebug).toHaveBeenCalledWith('info');
    });

    it('sets error log level', () => {
      Grovs.setDebug('error');
      expect(mockSetDebug).toHaveBeenCalledWith('error');
    });
  });

  describe('generateLink', () => {
    it('accepts an options object and forwards fields in native order', async () => {
      mockGenerateLink.mockResolvedValue('https://grovs.io/opts');

      const link = await Grovs.generateLink({
        title: 'Title',
        subtitle: 'Sub',
        imageURL: 'https://img.example.com/a.png',
        data: { k: 'v' },
        tags: ['t'],
        customRedirects: {
          ios: { link: 'https://i', open_if_app_installed: true },
          android: { link: 'https://a', open_if_app_installed: true },
          desktop: { link: 'https://d', open_if_app_installed: false },
        },
        showPreviewIos: true,
        showPreviewAndroid: false,
        tracking: { utm_source: 'x' },
        copyToClipboardIos: true,
        copyToClipboardAndroid: false,
      });

      expect(link).toBe('https://grovs.io/opts');
      expect(mockGenerateLink).toHaveBeenCalledWith(
        'Title',
        'Sub',
        'https://img.example.com/a.png',
        { k: 'v' },
        ['t'],
        {
          ios: { link: 'https://i', open_if_app_installed: true },
          android: { link: 'https://a', open_if_app_installed: true },
          desktop: { link: 'https://d', open_if_app_installed: false },
        },
        true,
        false,
        { utm_source: 'x' },
        true,
        false
      );
    });

    it('forwards copy-to-clipboard flags in positional form', async () => {
      mockGenerateLink.mockResolvedValue('https://grovs.io/pos');

      await Grovs.generateLink(
        'Title',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true,
        true
      );

      expect(mockGenerateLink).toHaveBeenCalledWith(
        'Title',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true,
        true
      );
    });

    it('passes undefined copy flags when the positional form omits them', async () => {
      mockGenerateLink.mockResolvedValue('https://grovs.io/legacy');

      await Grovs.generateLink('Title', 'Sub');

      const args = mockGenerateLink.mock.calls[0];
      expect(args).toHaveLength(11);
      expect(args[9]).toBeUndefined();
      expect(args[10]).toBeUndefined();
    });

    it('surfaces the SDK_DISABLED message from native', async () => {
      const err = Object.assign(
        new Error('Grovs SDK is disabled. Call setSDK(true) first.'),
        { code: 'SDK_DISABLED' }
      );
      mockGenerateLink.mockRejectedValue(err);

      await expect(Grovs.generateLink({ title: 'T' })).rejects.toThrow(
        'Failed to generate link: Grovs SDK is disabled. Call setSDK(true) first.'
      );
    });

    it('generates a link with all parameters', async () => {
      mockGenerateLink.mockResolvedValue('https://grovs.io/abc123');

      const customRedirects = {
        ios: { link: 'https://ios.example.com', open_if_app_installed: true },
        android: {
          link: 'https://android.example.com',
          open_if_app_installed: true,
        },
        desktop: {
          link: 'https://desktop.example.com',
          open_if_app_installed: false,
        },
      };
      const tracking = {
        utm_medium: 'social',
        utm_source: 'twitter',
        utm_campaign: 'launch',
      };

      const link = await Grovs.generateLink(
        'Title',
        'Subtitle',
        'https://img.example.com/pic.png',
        { key: 'value' },
        ['tag1', 'tag2'],
        customRedirects,
        true,
        false,
        tracking
      );

      expect(link).toBe('https://grovs.io/abc123');
      expect(mockGenerateLink).toHaveBeenCalledWith(
        'Title',
        'Subtitle',
        'https://img.example.com/pic.png',
        { key: 'value' },
        ['tag1', 'tag2'],
        customRedirects,
        true,
        false,
        tracking,
        undefined,
        undefined
      );
    });

    it('generates a link with minimal parameters', async () => {
      mockGenerateLink.mockResolvedValue('https://grovs.io/minimal');

      const link = await Grovs.generateLink('Title');
      expect(link).toBe('https://grovs.io/minimal');
    });

    it('throws on native error', async () => {
      mockGenerateLink.mockRejectedValue(new Error('Network error'));

      await expect(Grovs.generateLink('Title')).rejects.toThrow(
        'Failed to generate link: Network error'
      );
    });
  });

  describe('displayMessages', () => {
    it('calls native displayMessages', async () => {
      mockDisplayMessages.mockResolvedValue(undefined);
      await Grovs.displayMessages();
      expect(mockDisplayMessages).toHaveBeenCalled();
    });

    it('throws on native error', async () => {
      mockDisplayMessages.mockRejectedValue(new Error('Display failed'));

      await expect(Grovs.displayMessages()).rejects.toThrow(
        'Failed to display messages: Display failed'
      );
    });
  });

  describe('numberOfUnreadMessages', () => {
    it('returns unread count', async () => {
      mockNumberOfUnreadMessages.mockResolvedValue(5);

      const count = await Grovs.numberOfUnreadMessages();
      expect(count).toBe(5);
    });

    it('returns zero when no unread messages', async () => {
      mockNumberOfUnreadMessages.mockResolvedValue(0);

      const count = await Grovs.numberOfUnreadMessages();
      expect(count).toBe(0);
    });

    it('throws on native error', async () => {
      mockNumberOfUnreadMessages.mockRejectedValue(new Error('Fetch failed'));

      await expect(Grovs.numberOfUnreadMessages()).rejects.toThrow(
        'Failed to get unread messages count: Fetch failed'
      );
    });
  });

  describe('onDeeplinkReceived', () => {
    it('registers a listener and returns remove handle', () => {
      const callback = jest.fn();
      const subscription = Grovs.onDeeplinkReceived(callback);

      expect(subscription).toBeDefined();
      expect(typeof subscription.remove).toBe('function');
    });

    it('calls markReadyToHandleDeeplinks on registration', () => {
      const callback = jest.fn();
      Grovs.onDeeplinkReceived(callback);

      expect(mockMarkReadyToHandleDeeplinks).toHaveBeenCalled();
    });

    it('triggers callback when deeplink event is emitted', () => {
      const callback = jest.fn();
      Grovs.onDeeplinkReceived(callback);

      const deeplinkData = {
        link: 'https://grovs.io/deep',
        data: { screen: 'profile' },
      };
      // Simulate the NativeEventEmitter firing — triggerDeeplink fans out to listeners
      (Grovs as any).triggerDeeplink(deeplinkData);

      expect(callback).toHaveBeenCalledWith(deeplinkData);
    });

    it('stops receiving events after remove is called', () => {
      const callback = jest.fn();
      const subscription = Grovs.onDeeplinkReceived(callback);
      subscription.remove();

      const deeplinkData = { link: 'https://grovs.io/after-remove' };
      // Trigger on any remaining listeners — callback should not be in set
      (Grovs as any).triggerDeeplink(deeplinkData);

      expect(callback).not.toHaveBeenCalledWith(deeplinkData);
    });

    it('supports multiple concurrent listeners', () => {
      const cb1 = jest.fn();
      const cb2 = jest.fn();
      Grovs.onDeeplinkReceived(cb1);
      Grovs.onDeeplinkReceived(cb2);

      const deeplinkData = { link: 'https://grovs.io/multi' };
      (Grovs as any).triggerDeeplink(deeplinkData);

      expect(cb1).toHaveBeenCalledWith(deeplinkData);
      expect(cb2).toHaveBeenCalledWith(deeplinkData);
    });

    it('only removes the specific listener on remove', () => {
      const cb1 = jest.fn();
      const cb2 = jest.fn();
      const sub1 = Grovs.onDeeplinkReceived(cb1);
      Grovs.onDeeplinkReceived(cb2);

      sub1.remove();

      const deeplinkData = { link: 'https://grovs.io/partial' };
      (Grovs as any).triggerDeeplink(deeplinkData);

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledWith(deeplinkData);
    });
  });

  describe('markReadyToHandleDeeplinks', () => {
    it('forwards to native module', () => {
      Grovs.markReadyToHandleDeeplinks();
      expect(mockMarkReadyToHandleDeeplinks).toHaveBeenCalled();
    });
  });

  describe('logInAppPurchase', () => {
    const { Platform } = require('react-native');

    afterEach(() => {
      Platform.OS = 'ios';
    });

    it('on iOS forwards transactionId and resolves native result', async () => {
      Platform.OS = 'ios';
      mockLogInAppPurchase.mockResolvedValue(true);
      const result = await Grovs.logInAppPurchase({ transactionId: '12345' });
      expect(result).toBe(true);
      expect(mockLogInAppPurchase).toHaveBeenCalledWith('12345', undefined);
    });

    it('on iOS throws when transactionId is missing', async () => {
      Platform.OS = 'ios';
      await expect(
        Grovs.logInAppPurchase({ originalJson: '{"foo":1}' })
      ).rejects.toThrow('transactionId');
      expect(mockLogInAppPurchase).not.toHaveBeenCalled();
    });

    it('on iOS throws when transactionId is not numeric', async () => {
      Platform.OS = 'ios';
      await expect(
        Grovs.logInAppPurchase({ transactionId: 'abc' })
      ).rejects.toThrow('transactionId');
      expect(mockLogInAppPurchase).not.toHaveBeenCalled();
    });

    it('on Android forwards originalJson and resolves native result', async () => {
      Platform.OS = 'android';
      mockLogInAppPurchase.mockResolvedValue(true);
      const json = '{"productId":"premium_monthly"}';
      const result = await Grovs.logInAppPurchase({ originalJson: json });
      expect(result).toBe(true);
      expect(mockLogInAppPurchase).toHaveBeenCalledWith(undefined, json);
    });

    it('on Android throws when originalJson is missing', async () => {
      Platform.OS = 'android';
      await expect(
        Grovs.logInAppPurchase({ transactionId: '12345' })
      ).rejects.toThrow('originalJson');
      expect(mockLogInAppPurchase).not.toHaveBeenCalled();
    });

    it('throws wrapped error on native failure', async () => {
      Platform.OS = 'ios';
      mockLogInAppPurchase.mockRejectedValue(new Error('Purchase failed'));
      await expect(
        Grovs.logInAppPurchase({ transactionId: '12345' })
      ).rejects.toThrow('Failed to log in-app purchase: Purchase failed');
    });
  });

  describe('logCustomPurchase', () => {
    it('resolves with true on success', async () => {
      mockLogCustomPurchase.mockResolvedValue(true);
      const result = await Grovs.logCustomPurchase(
        'buy',
        999,
        'USD',
        'premium_monthly'
      );
      expect(result).toBe(true);
      expect(mockLogCustomPurchase).toHaveBeenCalledWith(
        'buy',
        999,
        'USD',
        'premium_monthly',
        undefined
      );
    });

    it('passes startDate when provided', async () => {
      mockLogCustomPurchase.mockResolvedValue(true);
      await Grovs.logCustomPurchase(
        'buy',
        999,
        'USD',
        'premium_monthly',
        '2026-01-15T00:00:00Z'
      );
      expect(mockLogCustomPurchase).toHaveBeenCalledWith(
        'buy',
        999,
        'USD',
        'premium_monthly',
        '2026-01-15T00:00:00Z'
      );
    });

    it('supports cancel type', async () => {
      mockLogCustomPurchase.mockResolvedValue(true);
      await Grovs.logCustomPurchase('cancel', 999, 'USD', 'premium_monthly');
      expect(mockLogCustomPurchase).toHaveBeenCalledWith(
        'cancel',
        999,
        'USD',
        'premium_monthly',
        undefined
      );
    });

    it('supports refund type', async () => {
      mockLogCustomPurchase.mockResolvedValue(true);
      await Grovs.logCustomPurchase('refund', 999, 'USD', 'premium_monthly');
      expect(mockLogCustomPurchase).toHaveBeenCalledWith(
        'refund',
        999,
        'USD',
        'premium_monthly',
        undefined
      );
    });

    it('throws on native error', async () => {
      mockLogCustomPurchase.mockRejectedValue(new Error('Track failed'));
      await expect(
        Grovs.logCustomPurchase('buy', 999, 'USD', 'product')
      ).rejects.toThrow('Failed to log custom purchase: Track failed');
    });
  });

  describe('track', () => {
    it('forwards name, properties and tags to native module', () => {
      Grovs.track('purchase', { item_id: 'sku-42', price: 19.99 }, ['promo']);
      expect(mockTrack).toHaveBeenCalledWith(
        'purchase',
        { item_id: 'sku-42', price: 19.99 },
        ['promo']
      );
    });

    it('forwards undefined properties and tags when omitted', () => {
      Grovs.track('button_tap');
      expect(mockTrack).toHaveBeenCalledWith(
        'button_tap',
        undefined,
        undefined
      );
    });
  });

  describe('trackScreenView', () => {
    it('forwards screen name and properties to native module', () => {
      Grovs.trackScreenView('Checkout', { section: 'payment' });
      expect(mockTrackScreenView).toHaveBeenCalledWith('Checkout', {
        section: 'payment',
      });
    });

    it('forwards undefined properties when omitted', () => {
      Grovs.trackScreenView('Home');
      expect(mockTrackScreenView).toHaveBeenCalledWith('Home', undefined);
    });
  });

  describe('setGlobalTags', () => {
    it('forwards tags to native module', () => {
      Grovs.setGlobalTags(['beta', 'experiment-A']);
      expect(mockSetGlobalTags).toHaveBeenCalledWith(['beta', 'experiment-A']);
    });

    it('forwards undefined to clear tags', () => {
      Grovs.setGlobalTags();
      expect(mockSetGlobalTags).toHaveBeenCalledWith(undefined);
    });
  });

  describe('setScreenAliases', () => {
    it('forwards aliases to native module', () => {
      Grovs.setScreenAliases({ Home: 'Home Page' });
      expect(mockSetScreenAliases).toHaveBeenCalledWith({ Home: 'Home Page' });
    });
  });

  describe('startScreenTracking', () => {
    it('tracks screens through trackScreenView', () => {
      let stateCallback: () => void = () => {};
      let route = { name: 'Home' };
      const ref = {
        getCurrentRoute: () => route,
        addListener: (_type: string, cb: () => void) => {
          stateCallback = cb;
          return jest.fn();
        },
      };

      Grovs.startScreenTracking(ref as any);
      expect(mockTrackScreenView).toHaveBeenCalledWith('Home', undefined);

      route = { name: 'Profile' };
      stateCallback();
      expect(mockTrackScreenView).toHaveBeenCalledWith('Profile', undefined);
    });

    it('replaces the previous subscription when called again', () => {
      // Faithful fake: unsubscribing removes the listener, like React Navigation
      let route = { name: 'Home' };
      const listeners = new Set<() => void>();
      const unsubscribes: Array<jest.Mock> = [];
      const ref = {
        getCurrentRoute: () => route,
        addListener: (_type: string, cb: () => void) => {
          listeners.add(cb);
          const unsubscribe = jest.fn(() => listeners.delete(cb));
          unsubscribes.push(unsubscribe);
          return unsubscribe;
        },
      };

      Grovs.startScreenTracking(ref as any);
      Grovs.startScreenTracking(ref as any);

      // The first subscription was torn down on the second start
      expect(unsubscribes[0]).toHaveBeenCalledTimes(1);

      // A navigation is tracked exactly once, not once per start call
      mockTrackScreenView.mockClear();
      route = { name: 'Profile' };
      listeners.forEach((cb) => cb());
      expect(mockTrackScreenView).toHaveBeenCalledTimes(1);
      expect(mockTrackScreenView).toHaveBeenCalledWith('Profile', undefined);
    });
  });
});

describe('native consent errors', () => {
  it.each([
    ['generateLink', mockGenerateLink, 'Failed to generate link'],
    ['displayMessages', mockDisplayMessages, 'Failed to display messages'],
    [
      'numberOfUnreadMessages',
      mockNumberOfUnreadMessages,
      'Failed to get unread messages count',
    ],
  ] as const)(
    'preserves SDK_DISABLED for %s',
    async (method, nativeMock, prefix) => {
      const message = 'Grovs SDK is disabled. Call setSDK(true) first.';
      nativeMock.mockRejectedValue(
        Object.assign(new Error(message), { code: 'SDK_DISABLED' })
      );
      await expect(Grovs[method]()).rejects.toMatchObject({
        code: 'SDK_DISABLED',
        message: `${prefix}: ${message}`,
      });
    }
  );
});

describe('TurboModule generateLink', () => {
  it('forwards options through the TurboModule adapter in native order', async () => {
    mockGenerateLink.mockResolvedValue('https://grovs.io/turbo');
    try {
      (global as any).RN$Bridgeless = true;
      let turboGrovs: typeof Grovs;
      jest.isolateModules(() => {
        turboGrovs = require('../index').default;
      });
      await expect(
        turboGrovs!.generateLink({
          title: 'Turbo',
          showPreviewIos: false,
          copyToClipboardIos: false,
          copyToClipboardAndroid: true,
        })
      ).resolves.toBe('https://grovs.io/turbo');
      expect(mockGenerateLink).toHaveBeenCalledWith(
        'Turbo',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        false,
        undefined,
        undefined,
        false,
        true
      );
    } finally {
      (global as any).RN$Bridgeless = false;
    }
  });
});
