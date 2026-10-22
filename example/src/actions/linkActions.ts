import Grovs from 'react-native-grovs-wrapper';
import type {
  CustomLinkRedirect,
  CustomRedirects,
  GenerateLinkOptions,
  Tracking,
} from 'react-native-grovs-wrapper';
import type { LinkForm, Redirect, TriState } from '../data/forms';
import { toValueMap } from '../data/keyValue';
import { callCode } from './callCode';
import type { TestAction } from './log';

const filled = (text: string): string | undefined =>
  text.trim() === '' ? undefined : text;

const triState = (state: TriState): boolean | undefined =>
  state === 'default' ? undefined : state === 'on';

function redirect(r: Redirect): CustomLinkRedirect | undefined {
  const link = filled(r.url.trim());
  return link
    ? { link, open_if_app_installed: r.openAppIfInstalled }
    : undefined;
}

/** Drops keys whose value is undefined, so only what is sent shows up. */
function defined<T extends object>(o: T): T {
  return Object.fromEntries(
    Object.entries(o).filter(([, value]) => value !== undefined)
  ) as T;
}

export function toGenerateOptions(form: LinkForm): GenerateLinkOptions {
  const data = toValueMap(form.data);
  const tracking: Tracking | undefined = form.utmOn
    ? defined({
        utm_source: filled(form.utmSource),
        utm_medium: filled(form.utmMedium),
        utm_campaign: filled(form.utmCampaign),
      })
    : undefined;
  // Native skips platforms that are missing, so not all three are needed.
  const customRedirects = form.redirectsOn
    ? (defined({
        android: redirect(form.android),
        ios: redirect(form.ios),
        desktop: redirect(form.desktop),
      }) as CustomRedirects)
    : undefined;
  return defined({
    title: filled(form.title),
    subtitle: filled(form.subtitle),
    imageURL: filled(form.imageUrl.trim()),
    data: Object.keys(data).length > 0 ? data : undefined,
    tags: form.tags.length > 0 ? form.tags : undefined,
    customRedirects,
    showPreviewIos: triState(form.previewIos),
    showPreviewAndroid: triState(form.previewAndroid),
    tracking,
    copyToClipboardIos: triState(form.clipboardIos),
    copyToClipboardAndroid: triState(form.clipboardAndroid),
  });
}

export function buildGenerateLink(form: LinkForm): TestAction {
  const o = toGenerateOptions(form);
  const args: Array<[string, unknown]> = [
    ['title', o.title],
    ['subtitle', o.subtitle],
    ['imageURL', o.imageURL],
    ['data', o.data],
    ['tags', o.tags],
    ['customRedirects', o.customRedirects],
    ['showPreviewIos', o.showPreviewIos],
    ['showPreviewAndroid', o.showPreviewAndroid],
    ['tracking', o.tracking],
    ['copyToClipboardIos', o.copyToClipboardIos],
    ['copyToClipboardAndroid', o.copyToClipboardAndroid],
  ];
  const code = callCode('generateLink', args);
  return {
    type: 'CREATE',
    title: 'Generate link',
    code,
    run: async () => {
      const link = await Grovs.generateLink(
        o.title,
        o.subtitle,
        o.imageURL,
        o.data,
        o.tags,
        o.customRedirects,
        o.showPreviewIos,
        o.showPreviewAndroid,
        o.tracking,
        o.copyToClipboardIos,
        o.copyToClipboardAndroid
      );
      return {
        state: 'ok',
        detail: link,
        value: link,
        code: `${code}\n\n-> "${link}"`,
      };
    },
  };
}
