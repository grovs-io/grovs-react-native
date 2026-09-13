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
