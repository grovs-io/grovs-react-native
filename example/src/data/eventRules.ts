export const RESERVED_EVENTS = [
  'view',
  'open',
  'install',
  'reinstall',
  'app_open',
  'time_spent',
  'reactivation',
  'user_referred',
  'custom',
  'screen_view',
];
export const MAX_TAGS = 20;
export const MAX_TAG_LENGTH = 255;

export function eventNameError(name: string): string | null {
  if (name.trim() === '') {
    return 'Enter an event name';
  }
  if (RESERVED_EVENTS.includes(name.trim().toLowerCase())) {
    return `"${name.trim()}" is reserved by the SDK`;
  }
  return null;
}

export function tagsError(tags: string[]): string | null {
  if (tags.length > MAX_TAGS) {
    return `Up to ${MAX_TAGS} tags`;
  }
  if (tags.some((tag) => tag.length > MAX_TAG_LENGTH)) {
    return `Each tag can have up to ${MAX_TAG_LENGTH} characters`;
  }
  return null;
}
