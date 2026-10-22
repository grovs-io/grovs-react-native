import Grovs from 'react-native-grovs-wrapper';
import type { InAppMessageEvent } from 'react-native-grovs-wrapper';
import { middleEllipsis } from '../data/strings';
import { exampleStore } from '../store/exampleStore';
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
  const error = exampleStore.configureError;
  if (error) {
    appLog.add('SDK', 'error', 'SDK configure failed', error);
    return;
  }
  const profile = exampleStore.startedProfile;
  appLog.add(
    'SDK',
    'ok',
    'SDK configured',
    `${profile.name} · ${profile.test ? 'test' : 'prod'}`,
    callCode('configure', [
      ['apiKey', middleEllipsis(profile.apiKey)],
      ['useTestEnvironment', profile.test],
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
