import { Platform } from 'react-native';
import Grovs from 'react-native-grovs-wrapper';
import { eventNameError, tagsError } from '../data/eventRules';
import {
  purchaseLabel,
  purchaseStartDate,
  type EventForm,
  type PurchaseForm,
  type ScreenForm,
} from '../data/forms';
import { toAliasMap, toValueMap, type KeyValueRow } from '../data/keyValue';
import { parseAmountToCents } from '../data/money';
import { callCode } from './callCode';
import type { ActionResult, TestAction } from './log';

function nonEmptyValueMap(rows: KeyValueRow[]) {
  const map = toValueMap(rows);
  return Object.keys(map).length > 0 ? map : undefined;
}

const loggedResult = (logged: boolean, detail: string): ActionResult =>
  logged
    ? { state: 'ok', detail }
    : { state: 'warning', detail: `not logged · ${detail}` };

/** With `force`, a name or tags the SDK should reject are sent anyway. */
export function buildTrack(form: EventForm, force = false): TestAction {
  const name = form.name.trim();
  const properties = nonEmptyValueMap(form.properties);
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
      return loggedResult(logged, `${cents} cents · ${productId}`);
    },
  };
}

export function buildScreenView(form: ScreenForm): TestAction {
  const name = form.name.trim();
  const properties = nonEmptyValueMap(form.properties);
  return {
    type: 'SCREEN',
    title: `Screen ${name}`,
    code: callCode('trackScreenView', [
      ['screenName', name],
      ['properties', properties],
    ]),
    run: async () => {
      if (name === '') throw new Error('Enter a screen name');
      Grovs.trackScreenView(name, properties);
      return { state: 'ok', detail: 'sent' };
    },
  };
}

/** The App Store transaction id on iOS, the Google Play purchase's originalJson on Android. */
export function buildStorePurchase(
  input: string,
  os: typeof Platform.OS = Platform.OS
): TestAction {
  const ios = os === 'ios';
  const value = input.trim();
  const purchase = ios ? { transactionId: value } : { originalJson: value };
  return {
    type: 'PURCHASE',
    title: ios ? 'App Store purchase' : 'Google Play purchase',
    code: callCode('logInAppPurchase', Object.entries(purchase)),
    run: async () => {
      if (value === '') {
        throw new Error(
          ios ? 'Enter a transaction id' : 'Paste the purchase JSON'
        );
      }
      return loggedResult(await Grovs.logInAppPurchase(purchase), 'sent');
    },
  };
}

export function buildSetGlobalTags(tags: string[]): TestAction {
  const value = tags.length > 0 ? tags : undefined;
  return {
    type: 'SDK',
    title: 'Global tags set',
    code: callCode('setGlobalTags', [['tags', value]]),
    repeatable: false,
    run: async () => {
      Grovs.setGlobalTags(value);
      return { state: 'ok', detail: tags.join(', ') || 'cleared' };
    },
  };
}

export function buildSetAliases(rows: KeyValueRow[]): TestAction {
  const aliases = toAliasMap(rows);
  return {
    type: 'SDK',
    title: 'Screen aliases set',
    code: callCode('setScreenAliases', [['aliases', aliases]]),
    repeatable: false,
    run: async () => {
      Grovs.setScreenAliases(aliases);
      return {
        state: 'ok',
        detail: `${Object.keys(aliases).length} aliases`,
      };
    },
  };
}
