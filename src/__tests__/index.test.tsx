const mockSetIdentifier = jest.fn();
const mockSetPushToken = jest.fn();
const mockSetAttributes = jest.fn();
const mockSetSDK = jest.fn();
const mockSetDebug = jest.fn();
const mockGenerateLink = jest.fn();
const mockDisplayMessages = jest.fn();
const mockNumberOfUnreadMessages = jest.fn();
const mockMarkReadyToHandleDeeplinks = jest.fn();
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
        addListener: mockAddListener,
        removeListeners: jest.fn(),
      },
    },
    NativeEventEmitter: jest.fn(() => ({
      addListener: addListenerMock,
    })),
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
        tracking
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
});
