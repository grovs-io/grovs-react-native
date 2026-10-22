import type { TransactionType } from 'react-native-grovs-wrapper';
import { detectType, type KeyValueRow, type ValueType } from './keyValue';
import { currencySymbol, formatCents, parseAmountToCents } from './money';

export type TriState = 'default' | 'on' | 'off';
export type Redirect = { url: string; openAppIfInstalled: boolean };

export type LinkForm = {
  title: string;
  subtitle: string;
  data: KeyValueRow[];
  imageUrl: string;
  tags: string[];
  utmOn: boolean;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  redirectsOn: boolean;
  android: Redirect;
  ios: Redirect;
  desktop: Redirect;
  previewAndroid: TriState;
  previewIos: TriState;
  clipboardAndroid: TriState;
  clipboardIos: TriState;
};

export type EventForm = {
  name: string;
  properties: KeyValueRow[];
  tags: string[];
};

export type ScreenForm = { name: string; properties: KeyValueRow[] };

export type PurchaseForm = {
  type: TransactionType;
  amount: string;
  currency: string;
  productId: string;
  startDaysAgo: number;
  originalJson: string;
};

export const SAMPLE_IMAGE_1 = 'https://picsum.photos/seed/grovs1/1200/630';
export const SAMPLE_IMAGE_2 = 'https://picsum.photos/seed/grovs2/1200/630';
export const SAMPLE_REDIRECTS = [
  'https://www.youtube.com',
  'https://www.google.com',
  'https://grovs.io',
];

export const DEFAULT_LINK_FORM: LinkForm = {
  title: 'Test title',
  subtitle: 'Test subtitle',
  data: [{ key: 'param1', value: 'Test value', type: 'text' }],
  imageUrl: '',
  tags: [],
  utmOn: false,
  utmSource: 'test_source',
  utmMedium: 'test_medium',
  utmCampaign: 'test_campaign',
  redirectsOn: false,
  android: { url: 'https://www.youtube.com', openAppIfInstalled: false },
  ios: { url: 'https://www.google.com', openAppIfInstalled: false },
  desktop: { url: '', openAppIfInstalled: false },
  previewAndroid: 'default',
  previewIos: 'default',
  clipboardAndroid: 'default',
  clipboardIos: 'default',
};

export const DEFAULT_EVENT_FORM: EventForm = {
  name: 'demo_tapped',
  properties: [],
  tags: [],
};

export const DEFAULT_SCREEN_FORM: ScreenForm = {
  name: 'Checkout',
  properties: [],
};

export const DEFAULT_PURCHASE_FORM: PurchaseForm = {
  type: 'buy',
  amount: '4.99',
  currency: 'USD',
  productId: 'pro_monthly',
  startDaysAgo: 0,
  originalJson: '',
};

export function linkMoreSummary(form: LinkForm): string {
  return [
    form.utmOn ? 'UTM on' : 'UTM off',
    form.tags.length === 0 ? 'no tags' : `${form.tags.length} tags`,
    form.imageUrl.trim() === '' ? 'no image' : 'image',
    form.redirectsOn ? 'redirects on' : 'no redirects',
  ].join(' · ');
}

export function linkOverridesSummary(form: LinkForm): string {
  const set = [
    form.previewAndroid,
    form.previewIos,
    form.clipboardAndroid,
    form.clipboardIos,
  ].filter((state) => state !== 'default').length;
  return set === 0 ? 'all default' : `${set} set`;
}

export function purchaseLabel(form: PurchaseForm): string {
  const cents = parseAmountToCents(form.amount);
  if (cents === null) return 'Log purchase';
  return `Log ${currencySymbol(form.currency)}${formatCents(cents)} ${form.type}`;
}

export const purchaseFullLabel = (form: PurchaseForm): string =>
  `${purchaseLabel(form)} · ${form.currency} · ${form.productId}`;

const DAY_MS = 86_400_000;

/** ISO start date for the purchase, or undefined to start now. */
export const purchaseStartDate = (
  daysAgo: number,
  now = Date.now()
): string | undefined =>
  daysAgo > 0 ? new Date(now - daysAgo * DAY_MS).toISOString() : undefined;

export const isPurchaseValid = (form: PurchaseForm): boolean =>
  parseAmountToCents(form.amount) !== null &&
  form.currency.trim() !== '' &&
  form.productId.trim() !== '';

type Json = Record<string, unknown>;

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function parseObject(json: string | null | undefined): Json | null {
  if (json == null) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    return typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as Json)
      : null;
  } catch {
    return null;
  }
}

const text = (o: Json, key: string, fallback: string): string =>
  typeof o[key] === 'string' ? (o[key] as string) : fallback;

const flag = (o: Json, key: string, fallback: boolean): boolean =>
  typeof o[key] === 'boolean' ? (o[key] as boolean) : fallback;

const strings = (o: Json, key: string): string[] =>
  Array.isArray(o[key])
    ? (o[key] as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];

const TYPES: ValueType[] = ['text', 'number', 'bool'];

function rows(o: Json, key: string, fallback: KeyValueRow[]): KeyValueRow[] {
  const list = o[key];
  if (!Array.isArray(list)) return fallback;
  return list
    .filter((r): r is Json => typeof r === 'object' && r !== null)
    .map((r) => {
      const value = typeof r.value === 'string' ? r.value : '';
      const type = TYPES.find((t) => t === r.type) ?? detectType(value);
      return { key: typeof r.key === 'string' ? r.key : '', value, type };
    });
}

function oneOf<T extends string>(
  o: Json,
  key: string,
  options: readonly T[],
  fallback: T
): T {
  return options.find((option) => option === o[key]) ?? fallback;
}

function redirect(o: Json, key: string, fallback: Redirect): Redirect {
  const r = o[key];
  if (typeof r !== 'object' || r === null) return fallback;
  const inner = r as Json;
  return {
    url: text(inner, 'url', fallback.url),
    openAppIfInstalled: flag(
      inner,
      'openAppIfInstalled',
      fallback.openAppIfInstalled
    ),
  };
}

const TRI_STATES: readonly TriState[] = ['default', 'on', 'off'];
const PURCHASE_TYPES: readonly TransactionType[] = ['buy', 'cancel', 'refund'];

export const encodeLinkForm = (form: LinkForm): string => JSON.stringify(form);

export function decodeLinkForm(json: string | null | undefined): LinkForm {
  const o = parseObject(json);
  const d = copy(DEFAULT_LINK_FORM);
  if (!o) return d;
  return {
    title: text(o, 'title', d.title),
    subtitle: text(o, 'subtitle', d.subtitle),
    data: rows(o, 'data', d.data),
    imageUrl: text(o, 'imageUrl', d.imageUrl),
    tags: strings(o, 'tags'),
    utmOn: flag(o, 'utmOn', d.utmOn),
    utmSource: text(o, 'utmSource', d.utmSource),
    utmMedium: text(o, 'utmMedium', d.utmMedium),
    utmCampaign: text(o, 'utmCampaign', d.utmCampaign),
    redirectsOn: flag(o, 'redirectsOn', d.redirectsOn),
    android: redirect(o, 'android', d.android),
    ios: redirect(o, 'ios', d.ios),
    desktop: redirect(o, 'desktop', d.desktop),
    previewAndroid: oneOf(o, 'previewAndroid', TRI_STATES, d.previewAndroid),
    previewIos: oneOf(o, 'previewIos', TRI_STATES, d.previewIos),
    clipboardAndroid: oneOf(
      o,
      'clipboardAndroid',
      TRI_STATES,
      d.clipboardAndroid
    ),
    clipboardIos: oneOf(o, 'clipboardIos', TRI_STATES, d.clipboardIos),
  };
}

export const encodeEventForm = (form: EventForm): string =>
  JSON.stringify(form);

export function decodeEventForm(json: string | null | undefined): EventForm {
  const o = parseObject(json);
  const d = copy(DEFAULT_EVENT_FORM);
  if (!o) return d;
  return {
    name: text(o, 'name', d.name),
    properties: rows(o, 'properties', d.properties),
    tags: strings(o, 'tags'),
  };
}

export const encodeScreenForm = (form: ScreenForm): string =>
  JSON.stringify(form);

export function decodeScreenForm(json: string | null | undefined): ScreenForm {
  const o = parseObject(json);
  const d = copy(DEFAULT_SCREEN_FORM);
  if (!o) return d;
  return {
    name: text(o, 'name', d.name),
    properties: rows(o, 'properties', d.properties),
  };
}

export const encodePurchaseForm = (form: PurchaseForm): string =>
  JSON.stringify(form);

export function decodePurchaseForm(
  json: string | null | undefined
): PurchaseForm {
  const o = parseObject(json);
  const d = copy(DEFAULT_PURCHASE_FORM);
  if (!o) return d;
  return {
    type: oneOf(o, 'type', PURCHASE_TYPES, d.type),
    amount: text(o, 'amount', d.amount),
    currency: text(o, 'currency', d.currency),
    productId: text(o, 'productId', d.productId),
    startDaysAgo:
      typeof o.startDaysAgo === 'number' && o.startDaysAgo >= 0
        ? o.startDaysAgo
        : d.startDaysAgo,
    originalJson: text(o, 'originalJson', d.originalJson),
  };
}
