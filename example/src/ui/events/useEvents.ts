import { useState } from 'react';
import {
  buildPurchase,
  buildScreenView,
  buildSetAliases,
  buildSetGlobalTags,
  buildStorePurchase,
  buildTrack,
} from '../../actions/eventActions';
import type { TestAction } from '../../actions/log';
import { appLog } from '../../actions/testLog';
import { runAction } from '../../actions/testRunner';
import {
  eventNameError,
  RESERVED_EVENTS,
  tagsError,
} from '../../data/eventRules';
import {
  isPurchaseValid,
  type EventForm,
  type PurchaseForm,
  type ScreenForm,
} from '../../data/forms';
import type { KeyValueRow } from '../../data/keyValue';
import { settingsStore } from '../../store/settingsStore';
import { useSavedForm } from '../useStore';

const run = (action: TestAction) => runAction(appLog, action);

/** Event, screen and purchase forms saved on every change and shared with Home, plus the saved setup. */
export function useEvents() {
  const [event, saveEvent] = useSavedForm('eventForm');
  const [screen, saveScreen] = useSavedForm('screenForm');
  const [purchase, savePurchase] = useSavedForm('purchaseForm');
  const [globalTags, setGlobalTags] = useState(() => settingsStore.globalTags);
  const [aliases, setAliases] = useState(() => settingsStore.screenAliases);

  const eventError = eventNameError(event.name) ?? tagsError(event.tags);
  const purchaseValid = isPurchaseValid(purchase);

  const trackEvent = (force = false) => {
    if (eventError !== null && !force) return;
    run(buildTrack(event, force));
  };

  const trackScreen = () => {
    if (screen.name.trim() === '') return;
    run(buildScreenView(screen));
  };

  const logPurchase = () => {
    if (purchaseValid) run(buildPurchase(purchase));
  };

  const logStorePurchase = () => {
    if (purchase.originalJson.trim() !== '') {
      run(buildStorePurchase(purchase.originalJson));
    }
  };

  const applyGlobalTags = (tags: string[]) => {
    setGlobalTags(tags);
    settingsStore.globalTags = tags;
    run(buildSetGlobalTags(tags));
  };

  const applyAliases = (rows: KeyValueRow[]) => {
    setAliases(rows);
    settingsStore.screenAliases = rows;
    run(buildSetAliases(rows));
  };

  return {
    event,
    // Reads the store, so two changes in one tick both land.
    updateEvent: (change: Partial<EventForm>) =>
      saveEvent({ ...settingsStore.eventForm, ...change }),
    eventError,
    reserved: RESERVED_EVENTS.includes(event.name.trim().toLowerCase()),
    trackEvent,
    screen,
    updateScreen: (change: Partial<ScreenForm>) =>
      saveScreen({ ...settingsStore.screenForm, ...change }),
    trackScreen,
    purchase,
    updatePurchase: (change: Partial<PurchaseForm>) =>
      savePurchase({ ...settingsStore.purchaseForm, ...change }),
    purchaseValid,
    logPurchase,
    logStorePurchase,
    globalTags,
    applyGlobalTags,
    aliases,
    applyAliases,
  };
}
