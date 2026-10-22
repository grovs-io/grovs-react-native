import { exportLog } from '../exportLog';
import type { LogEntry } from '../log';
import { formatClock } from '../../data/strings';

describe('exportLog', () => {
  it('writes the device header and entries in the given order', () => {
    const entries: LogEntry[] = [
      {
        id: 2,
        time: 20_000,
        type: 'EVENT',
        state: 'error',
        title: 'track x',
        detail: 'failed',
        code: 'track()',
      },
      {
        id: 1,
        time: 10_000,
        type: 'SDK',
        state: 'ok',
        title: 'SDK configured',
        detail: '',
        code: '',
      },
    ];
    const text = exportLog(entries, {
      model: 'Pixel',
      os: 'Android 15',
      sdkVersion: '3.1.0',
      project: 'Grovs test',
    });
    expect(text).toBe(
      [
        'Device: Pixel\nOS: Android 15\nSDK: 3.1.0\nProject: Grovs test',
        `${formatClock(20_000, true)} EVENT ERROR track x\nfailed\ntrack()`,
        `${formatClock(10_000, true)} SDK OK SDK configured`,
      ].join('\n\n')
    );
  });
});
