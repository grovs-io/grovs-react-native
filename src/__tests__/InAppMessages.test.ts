import { toInAppMessageEvent } from '../InAppMessages';

describe('toInAppMessageEvent', () => {
  it('maps shown', () => {
    expect(toInAppMessageEvent({ type: 'shown', campaignId: 'c1' })).toEqual({
      type: 'shown',
      campaignId: 'c1',
    });
  });

  it('maps clicked with nulls dropped', () => {
    expect(
      toInAppMessageEvent({
        type: 'clicked',
        campaignId: 'c1',
        buttonId: null,
        payload: null,
      })
    ).toStrictEqual({ type: 'clicked', campaignId: 'c1' });
  });

  it('keeps clicked payload', () => {
    const payload = { a: 1, b: { c: 'd' } };
    expect(
      toInAppMessageEvent({
        type: 'clicked',
        campaignId: 'c1',
        buttonId: 'b1',
        payload,
      })
    ).toEqual({ type: 'clicked', campaignId: 'c1', buttonId: 'b1', payload });
  });

  it('maps answered number and string', () => {
    expect(
      toInAppMessageEvent({
        type: 'answered',
        campaignId: 'c1',
        value: 4,
        comment: 'hi',
      })
    ).toEqual({ type: 'answered', campaignId: 'c1', value: 4, comment: 'hi' });
    expect(
      toInAppMessageEvent({
        type: 'answered',
        campaignId: 'c1',
        value: 'opt_a',
        comment: null,
      })
    ).toStrictEqual({ type: 'answered', campaignId: 'c1', value: 'opt_a' });
  });

  it('maps dismissed reason', () => {
    expect(
      toInAppMessageEvent({
        type: 'dismissed',
        campaignId: 'c1',
        reason: 'swipe',
      })
    ).toEqual({ type: 'dismissed', campaignId: 'c1', reason: 'swipe' });
  });

  it('passes unknown dismissed reasons through', () => {
    expect(
      toInAppMessageEvent({
        type: 'dismissed',
        campaignId: 'c1',
        reason: 'timeout',
      })
    ).toEqual({ type: 'dismissed', campaignId: 'c1', reason: 'timeout' });
  });

  it('returns null for dismissed without a reason', () => {
    expect(
      toInAppMessageEvent({ type: 'dismissed', campaignId: 'c1' })
    ).toBeNull();
  });

  it('maps failed without campaign', () => {
    expect(
      toInAppMessageEvent({ type: 'failed', message: 'no window' })
    ).toStrictEqual({ type: 'failed', message: 'no window' });
  });

  it('returns null for unknown type or missing campaignId on non-failed', () => {
    expect(toInAppMessageEvent({ type: 'other' })).toBeNull();
    expect(toInAppMessageEvent({ type: 'shown' })).toBeNull();
    expect(toInAppMessageEvent(null)).toBeNull();
  });
});
