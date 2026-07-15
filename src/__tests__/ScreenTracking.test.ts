import { startScreenTracking } from '../ScreenTracking';
import type { NavigationContainerRefLike } from '../ScreenTracking';

function makeFakeRef(initialRoute?: string) {
  let currentRoute: { name: string } | undefined = initialRoute
    ? { name: initialRoute }
    : undefined;
  const listeners: Array<() => void> = [];
  const unsubscribe = jest.fn();

  const ref: NavigationContainerRefLike = {
    getCurrentRoute: () => currentRoute,
    addListener: (_type: 'state', callback: () => void) => {
      listeners.push(callback);
      return unsubscribe;
    },
  };

  return {
    ref,
    unsubscribe,
    navigate(name: string) {
      currentRoute = { name };
      listeners.forEach((cb) => cb());
    },
  };
}

describe('startScreenTracking', () => {
  it('tracks the initial route immediately', () => {
    const track = jest.fn();
    const { ref } = makeFakeRef('Home');

    startScreenTracking(ref, track);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('Home');
  });

  it('does not track when there is no initial route yet', () => {
    const track = jest.fn();
    const { ref } = makeFakeRef();

    startScreenTracking(ref, track);

    expect(track).not.toHaveBeenCalled();
  });

  it('tracks route changes', () => {
    const track = jest.fn();
    const fake = makeFakeRef('Home');

    startScreenTracking(fake.ref, track);
    fake.navigate('Profile');

    expect(track).toHaveBeenNthCalledWith(1, 'Home');
    expect(track).toHaveBeenNthCalledWith(2, 'Profile');
  });

  it('dedupes consecutive identical route names', () => {
    const track = jest.fn();
    const fake = makeFakeRef('Home');

    startScreenTracking(fake.ref, track);
    fake.navigate('Home');
    fake.navigate('Home');

    expect(track).toHaveBeenCalledTimes(1);
  });

  it('tracks a route again after navigating away and back', () => {
    const track = jest.fn();
    const fake = makeFakeRef('Home');

    startScreenTracking(fake.ref, track);
    fake.navigate('Profile');
    fake.navigate('Home');

    expect(track).toHaveBeenCalledTimes(3);
    expect(track).toHaveBeenNthCalledWith(3, 'Home');
  });

  it('returns the unsubscribe function from the ref', () => {
    const track = jest.fn();
    const fake = makeFakeRef('Home');

    const stop = startScreenTracking(fake.ref, track);
    stop();

    expect(fake.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('returns a no-op and does not throw for an invalid ref', () => {
    const track = jest.fn();

    const stop = startScreenTracking(null as any, track);

    expect(typeof stop).toBe('function');
    expect(() => stop()).not.toThrow();
    expect(track).not.toHaveBeenCalled();
  });
});
