import { extractLinkPath } from '../data/linkTools';
import { exampleStore } from '../store/exampleStore';
import { callCode } from './callCode';
import type { LogEntry, LogState, LogType, TestAction } from './log';

export const MAX_ENTRIES = 500;
export const MAX_LINKS = 50;

const HISTORY_KEY = 'linkHistory';

export type LinkHistory = {
  load(): LogEntry[];
  save(entries: LogEntry[]): void;
};

type Listener = () => void;

/** Link opens survive restarts; actions do not. */
export const storeLinkHistory: LinkHistory = {
  load() {
    try {
      const parsed = JSON.parse(exampleStore.get(HISTORY_KEY) ?? '[]');
      return Array.isArray(parsed)
        ? parsed.map((e) => ({ ...e, id: 0, type: 'LINK', state: 'ok' }))
        : [];
    } catch {
      return [];
    }
  },
  save(entries) {
    const plain = entries.map((e) => {
      const copy = { ...e };
      delete copy.action;
      return copy;
    });
    exampleStore.set(HISTORY_KEY, JSON.stringify(plain));
  },
};

export class TestLog {
  private list: LogEntry[] = [];
  private unseen = false;
  private nextId = 1;
  private restored = false;
  private listeners = new Set<Listener>();

  constructor(
    private history: LinkHistory,
    private clock: () => number = Date.now
  ) {}

  entries(): LogEntry[] {
    return this.list;
  }

  unseenError(): boolean {
    return this.unseen;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  add(
    type: LogType,
    state: LogState,
    title: string,
    detail = '',
    code = '',
    action?: TestAction
  ): LogEntry {
    const entry: LogEntry = {
      id: this.nextId++,
      time: this.clock(),
      type,
      state,
      title,
      detail,
      code,
      ...(action ? { action } : {}),
    };
    this.prepend(entry);
    if (state === 'error') this.unseen = true;
    this.emit();
    return entry;
  }

  recordLinkOpen(link?: string, data?: object): LogEntry {
    const path = link ? (extractLinkPath(link) ?? link) : 'no link';
    const entry: LogEntry = {
      id: this.nextId++,
      time: this.clock(),
      type: 'LINK',
      state: 'ok',
      title: 'Opened from link',
      detail: path,
      code: callCode('onDeeplinkReceived', [
        ['link', link ?? null],
        ['data', data ?? null],
      ]),
      ...(link ? { link } : {}),
    };
    this.prepend(entry);
    this.saveLinks();
    this.emit();
    return entry;
  }

  /** Puts saved link opens under the entries that already arrived. Nothing is saved before this runs. */
  restoreHistory(): void {
    if (this.restored) return;
    this.restored = true;
    const saved = this.history.load().map((e) => ({ ...e, id: this.nextId++ }));
    this.list = [...this.list, ...saved].slice(0, MAX_ENTRIES);
    this.saveLinks();
    this.emit();
  }

  markSeen(): void {
    if (!this.unseen) return;
    this.unseen = false;
    this.emit();
  }

  clear(): void {
    this.list = [];
    this.unseen = false;
    this.restored = true;
    this.history.save([]);
    this.emit();
  }

  private prepend(entry: LogEntry): void {
    this.list = [entry, ...this.list].slice(0, MAX_ENTRIES);
  }

  private saveLinks(): void {
    if (!this.restored) return;
    this.history.save(
      this.list.filter((e) => e.type === 'LINK').slice(0, MAX_LINKS)
    );
  }

  private emit(): void {
    this.listeners.forEach((fn) => fn());
  }
}

export const appLog = new TestLog(storeLinkHistory);
