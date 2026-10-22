const AFTER = (text: string, separator: string, fallback: string) => {
  const index = text.indexOf(separator);
  return index < 0 ? fallback : text.slice(index + separator.length);
};

/** Accepts a full link, host/path or only the path, and returns the last path segment. */
export function extractLinkPath(input: string): string | null {
  const clean = input.trim().split('#')[0]!.split('?')[0]!;
  if (clean === '') {
    return null;
  }
  const afterScheme = AFTER(clean, '://', clean);
  const hasHost = clean.includes('://') || afterScheme.includes('/');
  const path = hasHost ? AFTER(afterScheme, '/', '') : afterScheme;
  const segments = path.split('/').filter((segment) => segment.trim() !== '');
  return segments.length > 0 ? segments[segments.length - 1]! : null;
}

export function isWebUrl(input: string): boolean {
  const value = input.trim();
  const rest = value.startsWith('https://')
    ? value.slice('https://'.length)
    : value.startsWith('http://')
      ? value.slice('http://'.length)
      : null;
  return rest !== null && rest.split('/')[0]!.trim() !== '';
}

const singleQuoted = (text: string) => `'${text.replace(/'/g, `'\\''`)}'`;

const doubleQuoted = (text: string) => `"${text.replace(/["$`\\]/g, '\\$&')}"`;

/** adb runs the command through the device shell too, so the link is quoted for both shells. */
export function openCommand(link: string, os: 'ios' | 'android'): string {
  return os === 'android'
    ? `adb shell ${doubleQuoted(`am start -a android.intent.action.VIEW -d ${singleQuoted(link)} io.grovs.example`)}`
    : `xcrun simctl openurl booted ${singleQuoted(link)}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function flatten(
  map: Record<string, unknown>,
  prefix = ''
): Array<[string, string]> {
  return Object.entries(map).flatMap(
    ([key, value]): Array<[string, string]> => {
      const name = prefix === '' ? key : `${prefix}.${key}`;
      if (isPlainObject(value)) {
        return flatten(value, name);
      }
      if (Array.isArray(value)) {
        return [[name, value.join(', ')]];
      }
      return [[name, String(value)]];
    }
  );
}
