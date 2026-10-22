import Grovs from 'react-native-grovs-wrapper';
import { DEFAULT_LINK_FORM, type LinkForm } from '../../data/forms';
import {
  buildGenerateLink,
  buildInspect,
  toGenerateOptions,
} from '../linkActions';
import { TestLog } from '../testLog';
import { runAction } from '../testRunner';

jest.mock('react-native-grovs-wrapper', () => ({
  __esModule: true,
  default: { generateLink: jest.fn(), linkDetails: jest.fn() },
}));

const generateLink = jest.mocked(Grovs.generateLink);
const linkDetails = jest.mocked(Grovs.linkDetails);

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

  it('leaves out redirects when every platform URL is blank', () => {
    const blank = { url: ' ', openAppIfInstalled: true };
    const options = toGenerateOptions(
      form({ redirectsOn: true, android: blank, ios: blank, desktop: blank })
    );
    expect(options).not.toHaveProperty('customRedirects');
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

describe('buildInspect', () => {
  const log = () =>
    new TestLog({ load: () => [], save: () => undefined }, () => 0);

  it('looks up the path of a full link and shows the details', async () => {
    linkDetails.mockResolvedValue({
      path: 'abc',
      title: 'Promo',
      active: true,
    });
    const action = buildInspect('https://grovs.link/abc?x=1');
    const result = await action.run();
    expect(linkDetails).toHaveBeenCalledWith('abc');
    expect(action.type).toBe('INSPECT');
    expect(result.state).toBe('ok');
    expect(result.detail).toBe('Promo · abc');
    expect(result.code).toContain('linkDetails(\n  path = "abc"\n)');
    expect(result.code).toContain('title: "Promo"');
    expect(result.code).toContain('active: true');
  });

  it('calls a link without a title Untitled', async () => {
    linkDetails.mockResolvedValue({ path: 'abc', title: null });
    const result = await buildInspect('abc').run();
    expect(result.detail).toBe('Untitled · abc');
  });

  it('logs an error without calling the SDK when there is no path', async () => {
    linkDetails.mockReset();
    const { result, entry } = await runAction(log(), buildInspect(''));
    expect(linkDetails).not.toHaveBeenCalled();
    expect(result.state).toBe('error');
    expect(result.detail).toBe('Not a Grovs link');
    expect(entry.type).toBe('INSPECT');
  });

  it('logs the SDK error when the lookup fails', async () => {
    linkDetails.mockRejectedValue(new Error('Link not found'));
    const { result } = await runAction(log(), buildInspect('grovs.link/zzz'));
    expect(linkDetails).toHaveBeenCalledWith('zzz');
    expect(result).toMatchObject({ state: 'error', detail: 'Link not found' });
  });
});
