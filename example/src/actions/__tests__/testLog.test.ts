import { matchesFilter } from '../log';
import type { LogEntry } from '../log';
import { MAX_ENTRIES, MAX_LINKS, TestLog } from '../testLog';
import type { LinkHistory } from '../testLog';

class FakeHistory implements LinkHistory {
  saved: LogEntry[] = [];
  load = () => this.saved;
  save = (entries: LogEntry[]) => {
    this.saved = entries;
  };
}

describe('TestLog', () => {
  let now = 1_000_000;
  let history: FakeHistory;
  let log: TestLog;

  beforeEach(() => {
    now = 1_000_000;
    history = new FakeHistory();
    log = new TestLog(history, () => now);
    log.restoreHistory();
  });

  it('puts the newest entry first and caps the list', () => {
    for (let i = 0; i < MAX_ENTRIES + 5; i++) log.add('EVENT', 'ok', `e${i}`);
    expect(log.entries()).toHaveLength(MAX_ENTRIES);
    expect(log.entries()[0]?.title).toBe(`e${MAX_ENTRIES + 4}`);
  });

  it('drops the oldest entry when entry 501 arrives', () => {
    for (let i = 1; i <= MAX_ENTRIES + 1; i++) log.add('EVENT', 'ok', `e${i}`);
    const titles = log.entries().map((e) => e.title);
    expect(titles).not.toContain('e1');
    expect(titles).toContain('e2');
  });

  it('records link opens and saves only link entries', () => {
    log.recordLinkOpen('https://grovs.link/a', { k: 1 });
    log.add('EVENT', 'ok', 'not a link');
    expect(history.saved.map((e) => e.link)).toEqual(['https://grovs.link/a']);
    expect(history.saved[0]?.detail).toBe('a');
  });

  it('does not save a failed clipboard open as link history', () => {
    log.recordLinkOpen('https://grovs.link/a');
    log.add('LINK', 'error', 'Open clipboard link', 'no handler');
    expect(history.saved.map((e) => e.link)).toEqual(['https://grovs.link/a']);
    expect(matchesFilter('Links', log.entries()[0]!)).toBe(true);
  });

  it('keeps at most 50 links in history', () => {
    for (let i = 0; i < MAX_LINKS + 10; i++) {
      log.recordLinkOpen(`https://grovs.link/${i}`);
    }
    expect(history.saved).toHaveLength(MAX_LINKS);
    expect(history.saved[0]?.link).toBe(`https://grovs.link/${MAX_LINKS + 9}`);
  });

  it('handles a link open without a link', () => {
    const entry = log.recordLinkOpen(undefined, undefined);
    expect(entry.detail).toBe('no link');
    expect(entry.link).toBeUndefined();
  });

  it('merges saved history under entries that already arrived', () => {
    const fresh = new TestLog(history, () => now);
    history.saved = [
      {
        id: 0,
        time: 5,
        type: 'LINK',
        state: 'ok',
        title: 'Opened from link',
        detail: 'old',
        code: '',
        link: 'https://grovs.link/old',
        fromLink: true,
      },
    ];
    fresh.recordLinkOpen('https://grovs.link/new');
    expect(history.saved).toHaveLength(1);
    fresh.restoreHistory();
    expect(fresh.entries().map((e) => e.link)).toEqual([
      'https://grovs.link/new',
      'https://grovs.link/old',
    ]);
    expect(new Set(fresh.entries().map((e) => e.id)).size).toBe(2);
    expect(history.saved).toHaveLength(2);
  });

  it('does not overwrite saved history before it is restored', () => {
    const fresh = new TestLog(history, () => now);
    history.saved = [
      {
        id: 0,
        time: 5,
        type: 'LINK',
        state: 'ok',
        title: 't',
        detail: '',
        code: '',
      },
    ];
    fresh.recordLinkOpen('https://grovs.link/new');
    expect(history.saved).toHaveLength(1);
  });

  it('does not bring old links back when cleared before restore', () => {
    const fresh = new TestLog(history, () => now);
    history.saved = [
      {
        id: 0,
        time: 5,
        type: 'LINK',
        state: 'ok',
        title: 't',
        detail: '',
        code: '',
      },
    ];
    fresh.clear();
    fresh.restoreHistory();
    expect(fresh.entries()).toEqual([]);
  });

  it('marks errors unseen until marked', () => {
    log.add('EVENT', 'ok', 'fine');
    expect(log.unseenError()).toBe(false);
    log.add('INSPECT', 'error', 'broken');
    expect(log.unseenError()).toBe(true);
    log.markSeen();
    expect(log.unseenError()).toBe(false);
  });

  it('clear empties everything', () => {
    log.recordLinkOpen('https://grovs.link/a');
    log.clear();
    expect(log.entries()).toEqual([]);
    expect(history.saved).toEqual([]);
  });

  it('notifies subscribers and keeps the snapshot stable between changes', () => {
    const fn = jest.fn();
    const off = log.subscribe(fn);
    const before = log.entries();
    expect(log.entries()).toBe(before);
    log.add('EVENT', 'ok', 'x');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(log.entries()).not.toBe(before);
    off();
    log.add('EVENT', 'ok', 'y');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('filters by group and errors', () => {
    const link = log.add('CREATE', 'ok', 'a');
    const error = log.add('EVENT', 'error', 'b');
    expect(matchesFilter('Links', link)).toBe(true);
    expect(matchesFilter('Links', error)).toBe(false);
    expect(matchesFilter('Events', error)).toBe(true);
    expect(matchesFilter('Errors', error)).toBe(true);
    expect(matchesFilter('All', link)).toBe(true);
    expect(matchesFilter('Push', link)).toBe(false);
  });
});
