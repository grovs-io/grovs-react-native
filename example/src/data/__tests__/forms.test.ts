import {
  DEFAULT_EVENT_FORM,
  DEFAULT_LINK_FORM,
  DEFAULT_PURCHASE_FORM,
  DEFAULT_SCREEN_FORM,
  decodeEventForm,
  decodeLinkForm,
  decodePurchaseForm,
  decodeScreenForm,
  encodeEventForm,
  encodeLinkForm,
  encodePurchaseForm,
  encodeScreenForm,
  linkMoreSummary,
  linkOverridesSummary,
  purchaseFullLabel,
  purchaseLabel,
  type LinkForm,
} from '../forms';

describe('defaults', () => {
  it('match the sample values', () => {
    expect(DEFAULT_LINK_FORM).toMatchObject({
      title: 'Test title',
      subtitle: 'Test subtitle',
      data: [{ key: 'param1', value: 'Test value', type: 'text' }],
      utmSource: 'test_source',
      android: { url: 'https://www.youtube.com', openAppIfInstalled: false },
      ios: { url: 'https://www.google.com', openAppIfInstalled: false },
    });
    expect(DEFAULT_EVENT_FORM.name).toBe('demo_tapped');
    expect(DEFAULT_SCREEN_FORM.name).toBe('Checkout');
    expect(DEFAULT_PURCHASE_FORM).toMatchObject({
      type: 'buy',
      amount: '4.99',
      currency: 'USD',
      productId: 'pro_monthly',
    });
  });
});

describe('json', () => {
  it('round trips the link form', () => {
    const form: LinkForm = {
      ...DEFAULT_LINK_FORM,
      title: 'T',
      data: [{ key: 'a', value: '1', type: 'text' }],
      imageUrl: 'https://picsum.photos/seed/grovs2/1200/630',
      tags: ['qa'],
      utmOn: true,
      utmCampaign: 'spring',
      redirectsOn: true,
      android: { url: 'https://a.com', openAppIfInstalled: true },
      previewIos: 'on',
      clipboardAndroid: 'off',
    };
    expect(decodeLinkForm(encodeLinkForm(form))).toEqual(form);
  });

  it('falls back to defaults on missing or bad json', () => {
    expect(decodeLinkForm(null)).toEqual(DEFAULT_LINK_FORM);
    expect(decodeLinkForm('{oops')).toEqual(DEFAULT_LINK_FORM);
    expect(decodeLinkForm('{}')).toEqual(DEFAULT_LINK_FORM);
    expect(decodeLinkForm('[1]')).toEqual(DEFAULT_LINK_FORM);
    expect(decodeEventForm('{oops')).toEqual(DEFAULT_EVENT_FORM);
    expect(decodeScreenForm(null)).toEqual(DEFAULT_SCREEN_FORM);
    expect(decodePurchaseForm('{}')).toEqual(DEFAULT_PURCHASE_FORM);
  });

  it('ignores values of the wrong type', () => {
    expect(
      decodeLinkForm('{"title":5,"previewIos":"bogus","tags":"x"}')
    ).toEqual(DEFAULT_LINK_FORM);
  });

  it('round trips the other forms', () => {
    const event = {
      name: 'signup',
      properties: [{ key: 'level', value: '3', type: 'number' as const }],
      tags: ['qa'],
    };
    expect(decodeEventForm(encodeEventForm(event))).toEqual(event);
    const screen = {
      name: 'Paywall',
      properties: [{ key: 'from', value: 'home', type: 'text' as const }],
    };
    expect(decodeScreenForm(encodeScreenForm(screen))).toEqual(screen);
    const purchase = {
      type: 'refund' as const,
      amount: '9.99',
      currency: 'EUR',
      productId: 'coins_100',
      originalJson: '{}',
    };
    expect(decodePurchaseForm(encodePurchaseForm(purchase))).toEqual(purchase);
  });
});

describe('summaries', () => {
  it('describes the link form', () => {
    expect(linkMoreSummary(DEFAULT_LINK_FORM)).toBe(
      'UTM off · no tags · no image · no redirects'
    );
    expect(linkOverridesSummary(DEFAULT_LINK_FORM)).toBe('all default');
    expect(
      linkOverridesSummary({
        ...DEFAULT_LINK_FORM,
        previewIos: 'on',
        clipboardIos: 'off',
      })
    ).toBe('2 set');
  });

  it('labels the purchase', () => {
    expect(purchaseLabel(DEFAULT_PURCHASE_FORM)).toBe('Log $4.99 buy');
    expect(purchaseFullLabel(DEFAULT_PURCHASE_FORM)).toBe(
      'Log $4.99 buy · USD · pro_monthly'
    );
    expect(purchaseLabel({ ...DEFAULT_PURCHASE_FORM, amount: 'x' })).toBe(
      'Log purchase'
    );
  });
});
