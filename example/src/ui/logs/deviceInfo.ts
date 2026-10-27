import { Platform } from 'react-native';
import type { DeviceInfo } from '../../actions/exportLog';
import { exampleStore } from '../../store/exampleStore';
import { version as sdkVersion } from '../../../../package.json';

type PlatformConstants = {
  Manufacturer?: string;
  Model?: string;
  Release?: string;
  osVersion?: string;
  systemName?: string;
  interfaceIdiom?: string;
};

/** iOS constants have no model name, so iOS reports the device kind. */
export function deviceModel(): string {
  const constants = Platform.constants as PlatformConstants;
  if (Platform.OS === 'android') {
    const name = [constants.Manufacturer, constants.Model].filter(Boolean);
    return name.join(' ') || 'unknown';
  }
  return constants.interfaceIdiom === 'pad' ? 'iPad' : 'iPhone';
}

export function deviceInfo(): DeviceInfo {
  const constants = Platform.constants as PlatformConstants;
  const os =
    Platform.OS === 'android'
      ? `Android ${constants.Release ?? Platform.Version}`
      : `${constants.systemName ?? 'iOS'} ${constants.osVersion ?? Platform.Version}`;
  return {
    model: deviceModel(),
    os,
    sdkVersion,
    project: exampleStore.startedProfile?.name ?? 'unknown',
  };
}
