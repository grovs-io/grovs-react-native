import Grovs from 'react-native-grovs-wrapper';
import {
  DEFAULT_EVENT_FORM,
  DEFAULT_PURCHASE_FORM,
  type EventForm,
  type PurchaseForm,
} from '../../data/forms';
import { buildPurchase, buildTrack } from '../eventActions';

jest.mock('react-native-grovs-wrapper', () => ({
  __esModule: true,
  default: { track: jest.fn(), logCustomPurchase: jest.fn() },
}));

const track = jest.mocked(Grovs.track);
const logCustomPurchase = jest.mocked(Grovs.logCustomPurchase);

const event = (overrides: Partial<EventForm> = {}): EventForm => ({
  ...DEFAULT_EVENT_FORM,
  ...overrides,
});
const purchase = (overrides: Partial<PurchaseForm> = {}): PurchaseForm => ({
  ...DEFAULT_PURCHASE_FORM,
  ...overrides,
});

beforeEach(() => {
  track.mockReset();
  logCustomPurchase.mockReset().mockResolvedValue(true);
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
