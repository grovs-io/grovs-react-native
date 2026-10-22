import Grovs from 'react-native-grovs-wrapper';
import { eventNameError, tagsError } from '../data/eventRules';
import {
  purchaseLabel,
  purchaseStartDate,
  type EventForm,
  type PurchaseForm,
} from '../data/forms';
import { toValueMap } from '../data/keyValue';
import { parseAmountToCents } from '../data/money';
import { callCode } from './callCode';
import type { TestAction } from './log';

/** With `force`, a name or tags the SDK should reject are sent anyway. */
export function buildTrack(form: EventForm, force = false): TestAction {
  const name = form.name.trim();
  const valueMap = toValueMap(form.properties);
  const properties = Object.keys(valueMap).length > 0 ? valueMap : undefined;
  const tags = form.tags.length > 0 ? form.tags : undefined;
  const code = callCode('track', [
    ['name', name],
    ['properties', properties],
    ['tags', tags],
  ]);
  return {
    type: 'EVENT',
    title: `track ${name}`,
    code,
    run: async () => {
      const error = eventNameError(form.name) ?? tagsError(form.tags);
      if (error && !force) throw new Error(error);
      Grovs.track(name, properties, tags);
      if (error) {
        return {
          state: 'warning',
          detail: 'sent anyway, the SDK should reject it',
        };
      }
      return { state: 'ok', detail: tags ? `tags ${tags.join(', ')}` : 'sent' };
    },
  };
}

export function buildPurchase(
  form: PurchaseForm,
  now = Date.now()
): TestAction {
  const cents = parseAmountToCents(form.amount);
  const currency = form.currency.trim();
  const productId = form.productId.trim();
  const startDate = purchaseStartDate(form.startDaysAgo, now);
  const code = callCode('logCustomPurchase', [
    ['type', form.type],
    ['priceInCents', cents],
    ['currency', currency],
    ['productId', productId],
    ['startDate', startDate],
  ]);
  return {
    type: 'PURCHASE',
    title: purchaseLabel(form),
    code,
    run: async () => {
      if (cents === null) throw new Error('Enter an amount like 4.99');
      const logged = await Grovs.logCustomPurchase(
        form.type,
        cents,
        currency,
        productId,
        startDate
      );
      const detail = `${cents} cents · ${productId}`;
      return logged
        ? { state: 'ok', detail }
        : { state: 'warning', detail: `not logged · ${detail}` };
    },
  };
}
