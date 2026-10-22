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
function model(constants: PlatformConstants): string {
  if (Platform.OS === 'android') {
    return [constants.Manufacturer, constants.Model].filter(Boolean).join(' ');
  }
  return constants.interfaceIdiom === 'pad' ? 'iPad' : 'iPhone';
}

function projectName(): string {
  try {
    return exampleStore.startedProfile.name;
  } catch {
    return 'unknown';
  }
}

export function deviceInfo(): DeviceInfo {
  const constants = Platform.constants as PlatformConstants;
  const os =
    Platform.OS === 'android'
      ? `Android ${constants.Release ?? Platform.Version}`
      : `${constants.systemName ?? 'iOS'} ${constants.osVersion ?? Platform.Version}`;
  return {
    model: model(constants) || 'unknown',
    os,
    sdkVersion,
    project: projectName(),
  };
}
