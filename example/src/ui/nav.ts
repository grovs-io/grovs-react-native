import { createContext, useContext } from 'react';

export type Tab = 'home' | 'links' | 'events' | 'inapp';

export const TABS: Tab[] = ['home', 'links', 'events', 'inapp'];

export const isTab = (value: unknown): value is Tab =>
  TABS.includes(value as Tab);

export type Nav = {
  openSettings(): void;
  closeSettings(): void;
  openExcluded(): void;
  closeExcluded(): void;
  /** Opens the logs panel, on one entry's detail when an id is given. */
  openLogs(entryId?: number): void;
};

const noop = () => {};

export const NavContext = createContext<Nav>({
  openSettings: noop,
  closeSettings: noop,
  openExcluded: noop,
  closeExcluded: noop,
  openLogs: noop,
});

export const useNav = (): Nav => useContext(NavContext);
