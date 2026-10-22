import { formatClock } from '../data/strings';
import type { LogEntry } from './log';

export type DeviceInfo = {
  model: string;
  os: string;
  sdkVersion: string;
  project: string;
};

export function exportLog(entries: LogEntry[], device: DeviceInfo): string {
  const header = [
    `Device: ${device.model}`,
    `OS: ${device.os}`,
    `SDK: ${device.sdkVersion}`,
    `Project: ${device.project}`,
  ].join('\n');
  const body = entries.map((e) =>
    [
      `${formatClock(e.time, true)} ${e.type} ${e.state.toUpperCase()} ${e.title}`,
      e.detail,
      e.code,
    ]
      .filter((line) => line.trim() !== '')
      .join('\n')
  );
  return [header, ...body].join('\n\n');
}
