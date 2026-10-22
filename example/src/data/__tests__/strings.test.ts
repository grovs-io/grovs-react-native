import { formatClock, middleEllipsis, relativeTime } from '../strings';

describe('middleEllipsis', () => {
  it('shortens in the middle', () => {
    expect(middleEllipsis('abcdefghijklmnopqrstuvwxyz')).toBe('abcde…vwxyz');
    expect(middleEllipsis('short')).toBe('short');
  });
});

describe('relativeTime', () => {
  it('describes elapsed time', () => {
    expect(relativeTime(30_000)).toBe('just now');
    expect(relativeTime(2 * 60_000 + 5_000)).toBe('2 min ago');
    expect(relativeTime(3 * 3_600_000)).toBe('3 h ago');
    expect(relativeTime(86_400_000)).toBe('yesterday');
    expect(relativeTime(2 * 86_400_000)).toBe('2 days ago');
  });
});

describe('formatClock', () => {
  const at = new Date(2026, 9, 22, 9, 5, 7).getTime();

  it('formats local time', () => {
    expect(formatClock(at)).toBe('09:05');
    expect(formatClock(at, true)).toBe('09:05:07');
  });
});
