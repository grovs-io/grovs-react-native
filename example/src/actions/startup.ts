import Grovs from 'react-native-grovs-wrapper';
import type { InAppMessageEvent } from 'react-native-grovs-wrapper';
import { toAliasMap, toValueMap } from '../data/keyValue';
import { middleEllipsis } from '../data/strings';
import { exampleStore } from '../store/exampleStore';
import { settingsStore } from '../store/settingsStore';
import { callCode } from './callCode';
import { appLog } from './testLog';

function inAppDetail(event: InAppMessageEvent): string {
  const { campaignId, ...rest } = event as Record<string, unknown>;
  delete rest.type;
  const extra = Object.entries(rest)
    .filter(([, value]) => value !== undefined)
    .map(
      ([key, value]) =>
        `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`
    );
  return [campaignId, ...extra].filter(Boolean).join(' · ');
}

function logConfigure(): void {
  if (!exampleStore.available) {
    appLog.add(
      'SDK',
      'error',
      'Example native module missing, rebuild the app'
    );
    return;
  }
  const error = exampleStore.configureError;
  if (error) {
    appLog.add('SDK', 'error', 'SDK configure failed', error);
    return;
  }
  const profile = exampleStore.startedProfile;
  if (!profile) return;
  appLog.add(
    'SDK',
    'ok',
    'SDK configured',
    `${profile.name} · ${profile.test ? 'test' : 'prod'}`,
    callCode('configure', [
      ['apiKey', middleEllipsis(profile.apiKey)],
      ['useTestEnvironment', profile.test],
      ['baseURL', profile.baseUrl],
      ['autoTrackScreenViews', profile.autoTrack],
      ['clipboardDomains', profile.clipboardDomains],
      ['enabled', profile.startEnabled],
    ])
  );
}

async function logPushToken(): Promise<void> {
  try {
    const token = await exampleStore.fetchPushToken();
    if (token === null) {
      appLog.add('PUSH', 'warning', 'No push token yet');
      return;
    }
    appLog.add(
      'PUSH',
      'ok',
      'Push token registered',
      middleEllipsis(token),
      callCode('setPushToken', [['token', token]])
    );
  } catch (e) {
    appLog.add(
      'PUSH',
      'warning',
      'Push token failed',
      e instanceof Error ? e.message : String(e)
    );
  }
}

/** The native SDKs do not keep these between launches, so the app sends them again. */
export function applySavedSettings(): void {
  const { identifier, attributes } = settingsStore.identity;
  Grovs.setIdentifier(identifier || undefined);
  Grovs.setAttributes(toValueMap(attributes));
  const tags = settingsStore.globalTags;
  Grovs.setGlobalTags(tags.length > 0 ? tags : undefined);
  Grovs.setScreenAliases(toAliasMap(settingsStore.screenAliases));
  Grovs.setInAppExcludedScreens(settingsStore.excludedScreens);
  Grovs.setInAppDebugLogging(settingsStore.inAppDebug);
  if (!settingsStore.inAppRunning) Grovs.pauseInAppMessages();
  Grovs.setDebug(settingsStore.debugLevel);
}

function applySettingsOrLog(): void {
  try {
    applySavedSettings();
  } catch (e) {
    appLog.add(
      'SDK',
      'error',
      'Saved settings not applied',
      e instanceof Error ? e.message : String(e)
    );
  }
}

/** Listeners go on synchronously so a cold start link open is not missed. */
export function startLogging(): void {
  Grovs.onDeeplinkReceived(({ link, data }) => {
    appLog.recordLinkOpen(link, data);
  });
  Grovs.onInAppMessage((event) => {
    appLog.add(
      'IN-APP',
      event.type === 'failed' ? 'error' : 'ok',
      event.type.charAt(0).toUpperCase() + event.type.slice(1),
      inAppDetail(event)
    );
  });
  logConfigure();
  exampleStore
    .load()
    .catch(() => undefined)
    .then(() => {
      applySettingsOrLog();
      appLog.restoreHistory();
      return logPushToken();
    })
    .catch((e) => {
      appLog.add(
        'SDK',
        'error',
        'Startup logging failed',
        e instanceof Error ? e.message : String(e)
      );
    });
}
