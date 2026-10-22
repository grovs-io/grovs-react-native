import {
  MAX_TAGS,
  MAX_TAG_LENGTH,
  RESERVED_EVENTS,
  eventNameError,
  tagsError,
} from '../eventRules';

const tags = (n: number) => Array.from({ length: n }, (_, i) => `t${i}`);

describe('eventNameError', () => {
  it('checks names', () => {
    expect(eventNameError('  ')).toBe('Enter an event name');
    expect(eventNameError(' screen_view ')).toBe(
      '"screen_view" is reserved by the SDK'
    );
    expect(eventNameError('install')).toContain('reserved');
    expect(eventNameError('Install')).toContain('reserved');
    expect(eventNameError('demo_tapped')).toBeNull();
  });

  it('lists every reserved name', () => {
    RESERVED_EVENTS.forEach((name) =>
      expect(eventNameError(name)).toContain('reserved')
    );
    expect(RESERVED_EVENTS).toHaveLength(10);
  });
});

describe('tagsError', () => {
  it('checks tags', () => {
    expect(MAX_TAGS).toBe(20);
    expect(MAX_TAG_LENGTH).toBe(255);
    expect(tagsError(tags(20))).toBeNull();
    expect(tagsError(tags(21))).toBe('Up to 20 tags');
    expect(tagsError(['x'.repeat(256)])).toBe(
      'Each tag can have up to 255 characters'
    );
  });
});
