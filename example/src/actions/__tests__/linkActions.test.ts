import Grovs from 'react-native-grovs-wrapper';
import { DEFAULT_LINK_FORM, type LinkForm } from '../../data/forms';
import { buildGenerateLink, toGenerateOptions } from '../linkActions';

jest.mock('react-native-grovs-wrapper', () => ({
  __esModule: true,
  default: { generateLink: jest.fn() },
}));

const generateLink = jest.mocked(Grovs.generateLink);

const form = (overrides: Partial<LinkForm> = {}): LinkForm => ({
  ...DEFAULT_LINK_FORM,
  ...overrides,
});

beforeEach(() => {
  generateLink.mockReset().mockResolvedValue('https://grovs.link/abc');
});

describe('toGenerateOptions', () => {
  it('sends only the filled values of the default form', () => {
    expect(toGenerateOptions(form())).toEqual({
      title: 'Test title',
      subtitle: 'Test subtitle',
      data: { param1: 'Test value' },
    });
  });

  it('leaves out blank text, empty data and empty tags', () => {
    const options = toGenerateOptions(form({ title: ' ', data: [] }));
    expect(options).not.toHaveProperty('title');
    expect(options).not.toHaveProperty('data');
    expect(options).not.toHaveProperty('tags');
    expect(options).not.toHaveProperty('imageURL');
  });

  it('sends image and tags when set', () => {
    const options = toGenerateOptions(
      form({ imageUrl: 'https://img.test/a.png', tags: ['qa', 'beta'] })
    );
    expect(options.imageURL).toBe('https://img.test/a.png');
    expect(options.tags).toEqual(['qa', 'beta']);
  });

  it('sends tracking only when UTM is on', () => {
    expect(toGenerateOptions(form({ utmOn: false }))).not.toHaveProperty(
      'tracking'
    );
    expect(toGenerateOptions(form({ utmOn: true })).tracking).toEqual({
      utm_source: 'test_source',
      utm_medium: 'test_medium',
      utm_campaign: 'test_campaign',
    });
  });

  it('sends redirects only when on, skipping platforms without a URL', () => {
    expect(toGenerateOptions(form())).not.toHaveProperty('customRedirects');
    const options = toGenerateOptions(
      form({
        redirectsOn: true,
        ios: { url: 'https://www.google.com', openAppIfInstalled: true },
      })
    );
    expect(options.customRedirects).toEqual({
      android: {
        link: 'https://www.youtube.com',
        open_if_app_installed: false,
      },
      ios: { link: 'https://www.google.com', open_if_app_installed: true },
    });
  });

  it('leaves out platform overrides set to default', () => {
    const options = toGenerateOptions(
      form({ previewIos: 'on', clipboardAndroid: 'off' })
    );
    expect(options.showPreviewIos).toBe(true);
    expect(options.copyToClipboardAndroid).toBe(false);
    expect(options).not.toHaveProperty('showPreviewAndroid');
    expect(options).not.toHaveProperty('copyToClipboardIos');
  });
});

describe('buildGenerateLink', () => {
  it('calls generateLink with every argument in order and returns the link', async () => {
    const action = buildGenerateLink(form({ previewAndroid: 'on' }));
    const result = await action.run();
    expect(generateLink).toHaveBeenCalledWith(
      'Test title',
      'Test subtitle',
      undefined,
      { param1: 'Test value' },
      undefined,
      undefined,
      undefined,
      true,
      undefined,
      undefined,
      undefined
    );
    expect(action.type).toBe('CREATE');
    expect(result).toMatchObject({
      state: 'ok',
      value: 'https://grovs.link/abc',
    });
    expect(result.code).toContain('-> "https://grovs.link/abc"');
  });

  it('lists every argument in the code', () => {
    const { code } = buildGenerateLink(form());
    [
      'title',
      'subtitle',
      'imageURL',
      'data',
      'tags',
      'customRedirects',
      'showPreviewIos',
      'showPreviewAndroid',
      'tracking',
      'copyToClipboardIos',
      'copyToClipboardAndroid',
    ].forEach((name) => expect(code).toContain(`${name} = `));
    expect(code.startsWith('generateLink(')).toBe(true);
  });
});
