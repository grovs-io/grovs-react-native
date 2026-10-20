jest.mock('../withGrovsIOS', () => jest.fn((config) => config));
jest.mock('../withGrovsAndroid', () => jest.fn((config) => config));

const withGrovs = require('../index');
const withGrovsIOS = require('../withGrovsIOS');
const withGrovsAndroid = require('../withGrovsAndroid');

describe('plugin clipboardDomains', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([undefined, [], ['a.example', 'b.example']])(
    'forwards clipboard domains to both platforms (%j)',
    (clipboardDomains) => {
      const config = {};
      expect(
        withGrovs(config, { apiKey: 'key', scheme: 'grovs', clipboardDomains })
      ).toBe(config);
      const props = expect.objectContaining({
        apiKey: 'key',
        scheme: 'grovs',
        useTestEnvironment: false,
        baseURL: null,
        associatedDomains: [],
        clipboardDomains: clipboardDomains ?? [],
      });
      expect(withGrovsIOS).toHaveBeenCalledWith(config, props);
      expect(withGrovsAndroid).toHaveBeenCalledWith(config, props);
    }
  );

  it.each([null, 'a.example', 123, {}, [123], ['a.example', null]])(
    'rejects invalid clipboard domains (%j)',
    (clipboardDomains) => {
      expect(() =>
        withGrovs({}, { apiKey: 'key', scheme: 'grovs', clipboardDomains })
      ).toThrow('clipboardDomains');
      expect(withGrovsIOS).not.toHaveBeenCalled();
      expect(withGrovsAndroid).not.toHaveBeenCalled();
    }
  );
});

describe('plugin push options', () => {
  beforeEach(() => jest.clearAllMocks());

  it('defaults push off and no notification icon', () => {
    withGrovs({}, { apiKey: 'key', scheme: 'grovs' });
    const props = expect.objectContaining({
      push: false,
      androidNotificationIcon: null,
    });
    expect(withGrovsIOS).toHaveBeenCalledWith({}, props);
    expect(withGrovsAndroid).toHaveBeenCalledWith({}, props);
  });

  it('forwards push and the notification icon to both platforms', () => {
    withGrovs(
      {},
      {
        apiKey: 'key',
        scheme: 'grovs',
        push: true,
        androidNotificationIcon: 'ic',
      }
    );
    const props = expect.objectContaining({
      push: true,
      androidNotificationIcon: 'ic',
    });
    expect(withGrovsIOS).toHaveBeenCalledWith({}, props);
    expect(withGrovsAndroid).toHaveBeenCalledWith({}, props);
  });

  it.each([null, 'yes', 1, {}])('rejects a non-boolean push (%j)', (push) => {
    expect(() =>
      withGrovs({}, { apiKey: 'key', scheme: 'grovs', push })
    ).toThrow('push');
    expect(withGrovsIOS).not.toHaveBeenCalled();
  });

  it.each([null, '', 1, {}])(
    'rejects an invalid androidNotificationIcon (%j)',
    (androidNotificationIcon) => {
      expect(() =>
        withGrovs(
          {},
          { apiKey: 'key', scheme: 'grovs', androidNotificationIcon }
        )
      ).toThrow('androidNotificationIcon');
      expect(withGrovsAndroid).not.toHaveBeenCalled();
    }
  );
});
