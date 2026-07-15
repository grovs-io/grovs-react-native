import { log } from './Logger';

/**
 * Structural type matching a React Navigation NavigationContainerRef.
 * Declared locally so the SDK has no dependency on @react-navigation/native.
 */
export interface NavigationContainerRefLike {
  getCurrentRoute(): { name: string } | undefined;
  addListener(type: 'state', callback: () => void): () => void;
}

/**
 * Subscribes to a React Navigation container ref and reports every distinct
 * route change through `track`. Tracks the current route immediately, so call
 * it from NavigationContainer's onReady.
 *
 * @param navigationRef - A NavigationContainerRef (from useNavigationContainerRef
 *   or createNavigationContainerRef)
 * @param track - Called with the route name for each new screen
 * @returns An unsubscribe function
 */
export function startScreenTracking(
  navigationRef: NavigationContainerRefLike,
  track: (screenName: string) => void
): () => void {
  if (
    !navigationRef ||
    typeof navigationRef.getCurrentRoute !== 'function' ||
    typeof navigationRef.addListener !== 'function'
  ) {
    log(
      'error',
      'startScreenTracking: invalid navigation ref, screen tracking not started'
    );
    return () => {};
  }

  let lastScreenName: string | undefined;

  const trackCurrentRoute = () => {
    const name = navigationRef.getCurrentRoute()?.name;
    if (name && name !== lastScreenName) {
      lastScreenName = name;
      track(name);
    }
  };

  trackCurrentRoute();
  return navigationRef.addListener('state', trackCurrentRoute);
}
