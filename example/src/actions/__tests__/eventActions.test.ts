import Grovs from 'react-native-grovs-wrapper';
import {
  DEFAULT_EVENT_FORM,
  DEFAULT_PURCHASE_FORM,
  DEFAULT_SCREEN_FORM,
  type EventForm,
  type PurchaseForm,
} from '../../data/forms';
import {
  buildPurchase,
  buildScreenView,
  buildSetAliases,
  buildSetGlobalTags,
  buildStorePurchase,
  buildTrack,
} from '../eventActions';

jest.mock('react-native-grovs-wrapper', () => ({
  __esModule: true,
  default: {
    track: jest.fn(),
    trackScreenView: jest.fn(),
    setGlobalTags: jest.fn(),
    setScreenAliases: jest.fn(),
    logCustomPurchase: jest.fn(),
    logInAppPurchase: jest.fn(),
  },
}));

const grovs = jest.mocked(Grovs);
const track = grovs.track;
const logCustomPurchase = grovs.logCustomPurchase;

const event = (overrides: Partial<EventForm> = {}): EventForm => ({
  ...DEFAULT_EVENT_FORM,
  ...overrides,
});
const purchase = (overrides: Partial<PurchaseForm> = {}): PurchaseForm => ({
  ...DEFAULT_PURCHASE_FORM,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  logCustomPurchase.mockResolvedValue(true);
  grovs.logInAppPurchase.mockResolvedValue(true);
});

describe('repeatable', () => {
  it('setters cannot run again', () => {
    expect(buildSetGlobalTags(['qa']).repeatable).toBe(false);
    expect(
      buildSetAliases([{ key: 'Home', value: 'Home screen', type: 'text' }])
        .repeatable
    ).toBe(false);
  });

  it('tests can run again', () => {
    expect(buildTrack(event()).repeatable).not.toBe(false);
    expect(buildScreenView(DEFAULT_SCREEN_FORM).repeatable).not.toBe(false);
    expect(buildPurchase(purchase()).repeatable).not.toBe(false);
    expect(buildStorePurchase('1000').repeatable).not.toBe(false);
  });
});

describe('buildTrack', () => {
  it('tracks the default event without properties or tags', async () => {
    const action = buildTrack(event());
    const result = await action.run();
    expect(track).toHaveBeenCalledWith('demo_tapped', undefined, undefined);
    expect(action).toMatchObject({ type: 'EVENT', title: 'track demo_tapped' });
    expect(result).toMatchObject({ state: 'ok', detail: 'sent' });
  });

  it('sends typed properties and tags', async () => {
    await buildTrack(
      event({
        name: ' signup ',
        properties: [{ key: 'level', value: '3', type: 'number' }],
        tags: ['qa'],
      })
    ).run();
    expect(track).toHaveBeenCalledWith('signup', { level: 3 }, ['qa']);
  });

  it('blocks a reserved name before calling the SDK', async () => {
    await expect(buildTrack(event({ name: 'install' })).run()).rejects.toThrow(
      '"install" is reserved by the SDK'
    );
    expect(track).not.toHaveBeenCalled();
  });

  it('blocks too many tags', async () => {
    const tags = Array.from({ length: 21 }, (_, i) => `t${i}`);
    await expect(buildTrack(event({ tags })).run()).rejects.toThrow(
      'Up to 20 tags'
    );
    expect(track).not.toHaveBeenCalled();
  });

  it('sends a reserved name when forced and warns', async () => {
    const result = await buildTrack(event({ name: 'install' }), true).run();
    expect(track).toHaveBeenCalledWith('install', undefined, undefined);
    expect(result.state).toBe('warning');
  });
});

describe('buildPurchase', () => {
  it('logs the default purchase in cents with no start date', async () => {
    const action = buildPurchase(purchase());
    const result = await action.run();
    expect(logCustomPurchase).toHaveBeenCalledWith(
      'buy',
      499,
      'USD',
      'pro_monthly',
      undefined
    );
    expect(action).toMatchObject({ type: 'PURCHASE', title: 'Log $4.99 buy' });
    expect(result).toMatchObject({
      state: 'ok',
      detail: '499 cents · pro_monthly',
    });
  });

  it('sends the start date for a purchase in the past', async () => {
    const now = Date.UTC(2026, 9, 22, 12);
    await buildPurchase(
      purchase({ type: 'refund', startDaysAgo: 30 }),
      now
    ).run();
    expect(logCustomPurchase).toHaveBeenCalledWith(
      'refund',
      499,
      'USD',
      'pro_monthly',
      '2026-09-22T12:00:00.000Z'
    );
  });

  it('rejects an invalid amount without calling the SDK', async () => {
    await expect(
      buildPurchase(purchase({ amount: 'x' })).run()
    ).rejects.toThrow();
    expect(logCustomPurchase).not.toHaveBeenCalled();
  });

  it('warns when the SDK reports the purchase was not logged', async () => {
    logCustomPurchase.mockResolvedValue(false);
    const result = await buildPurchase(purchase()).run();
    expect(result.state).toBe('warning');
  });
});

describe('buildScreenView', () => {
  it('tracks the screen without properties', async () => {
    const action = buildScreenView({ name: ' Home ', properties: [] });
    const result = await action.run();
    expect(grovs.trackScreenView).toHaveBeenCalledWith('Home', undefined);
    expect(action).toMatchObject({ type: 'SCREEN', title: 'Screen Home' });
    expect(result.state).toBe('ok');
  });

  it('sends typed properties', async () => {
    await buildScreenView({
      name: 'Links',
      properties: [{ key: 'from', value: 'tab', type: 'text' }],
    }).run();
    expect(grovs.trackScreenView).toHaveBeenCalledWith('Links', {
      from: 'tab',
    });
  });

  it('blocks a blank name before calling the SDK', async () => {
    await expect(
      buildScreenView({ name: ' ', properties: [] }).run()
    ).rejects.toThrow('Enter a screen name');
    expect(grovs.trackScreenView).not.toHaveBeenCalled();
  });
});

describe('buildStorePurchase', () => {
  it('sends the transaction id on iOS', async () => {
    const action = buildStorePurchase(' 2000000123 ', 'ios');
    const result = await action.run();
    expect(grovs.logInAppPurchase).toHaveBeenCalledWith({
      transactionId: '2000000123',
    });
    expect(action).toMatchObject({
      type: 'PURCHASE',
      title: 'App Store purchase',
    });
    expect(result.state).toBe('ok');
  });

  it('sends the original JSON on Android', async () => {
    const json = '{"orderId":"GPA.1"}';
    const action = buildStorePurchase(json, 'android');
    await action.run();
    expect(grovs.logInAppPurchase).toHaveBeenCalledWith({ originalJson: json });
    expect(action.title).toBe('Google Play purchase');
  });

  it('blocks blank input before calling the SDK', async () => {
    await expect(buildStorePurchase('  ', 'ios').run()).rejects.toThrow(
      'Enter a transaction id'
    );
    await expect(buildStorePurchase('', 'android').run()).rejects.toThrow(
      'Paste the purchase JSON'
    );
    expect(grovs.logInAppPurchase).not.toHaveBeenCalled();
  });

  it('warns when the SDK reports the purchase was not logged', async () => {
    grovs.logInAppPurchase.mockResolvedValue(false);
    const result = await buildStorePurchase('1', 'ios').run();
    expect(result.state).toBe('warning');
  });
});

describe('buildSetGlobalTags', () => {
  it('sets the tags', async () => {
    const result = await buildSetGlobalTags(['beta', 'qa']).run();
    expect(grovs.setGlobalTags).toHaveBeenCalledWith(['beta', 'qa']);
    expect(result).toMatchObject({ state: 'ok', detail: 'beta, qa' });
  });

  it('clears the tags with no list', async () => {
    const result = await buildSetGlobalTags([]).run();
    expect(grovs.setGlobalTags).toHaveBeenCalledWith(undefined);
    expect(result.detail).toBe('cleared');
  });
});

describe('buildSetAliases', () => {
  it('sends the rows as a string map, skipping blank keys', async () => {
    const result = await buildSetAliases([
      { key: 'Home', value: 'Home screen', type: 'text' },
      { key: ' ', value: 'ignored', type: 'text' },
    ]).run();
    expect(grovs.setScreenAliases).toHaveBeenCalledWith({
      Home: 'Home screen',
    });
    expect(result).toMatchObject({ state: 'ok', detail: '1 aliases' });
  });
});
