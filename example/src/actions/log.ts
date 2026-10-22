export type LogType =
  | 'LINK'
  | 'CREATE'
  | 'INSPECT'
  | 'EVENT'
  | 'SCREEN'
  | 'PURCHASE'
  | 'IN-APP'
  | 'PUSH'
  | 'SDK';

export type LogState = 'ok' | 'warning' | 'error' | 'neutral';

export type LogFilter =
  | 'All'
  | 'Links'
  | 'In-app'
  | 'Events'
  | 'Push'
  | 'Errors';

export const LOG_FILTERS: LogFilter[] = [
  'All',
  'Links',
  'In-app',
  'Events',
  'Push',
  'Errors',
];

/** One SDK call with its values, kept by the log so it can be run again. */
export type TestAction = {
  type: LogType;
  title: string;
  code: string;
  /** Setters are not repeatable: an old one would leave the screen showing a newer value than the SDK has. */
  repeatable?: boolean;
  run: () => Promise<ActionResult>;
};

export type ActionResult = {
  state: LogState;
  detail: string;
  value?: string;
  code?: string;
};

export type LogEntry = {
  id: number;
  time: number;
  type: LogType;
  state: LogState;
  title: string;
  detail: string;
  code: string;
  action?: TestAction;
  link?: string;
};

const FILTER_TYPES: Record<Exclude<LogFilter, 'All' | 'Errors'>, LogType[]> = {
  'Links': ['LINK', 'CREATE', 'INSPECT'],
  'In-app': ['IN-APP'],
  'Events': ['EVENT', 'SCREEN', 'PURCHASE'],
  'Push': ['PUSH'],
};

export function matchesFilter(filter: LogFilter, entry: LogEntry): boolean {
  if (filter === 'All') return true;
  if (filter === 'Errors') return entry.state === 'error';
  return FILTER_TYPES[filter].includes(entry.type);
}
