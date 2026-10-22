import { extractLinkPath, flatten, isWebUrl, openCommand } from '../linkTools';

describe('extractLinkPath', () => {
  it('returns the last path segment', () => {
    expect(extractLinkPath('https://grovs.link/x7Kp2a')).toBe('x7Kp2a');
    expect(extractLinkPath('grovs.link/x7Kp2a')).toBe('x7Kp2a');
    expect(extractLinkPath('  x7Kp2a  ')).toBe('x7Kp2a');
    expect(extractLinkPath('https://grovs.link/a/b/?utm=1#top')).toBe('b');
    expect(extractLinkPath('https://grovs.link/abc?x=1')).toBe('abc');
  });

  it('returns null without a path', () => {
    expect(extractLinkPath('https://grovs.link/')).toBeNull();
    expect(extractLinkPath('https://grovs.link')).toBeNull();
    expect(extractLinkPath('   ')).toBeNull();
  });
});

describe('isWebUrl', () => {
  it('needs http(s) and a host', () => {
    expect(isWebUrl('https://grovs.link/x')).toBe(true);
    expect(isWebUrl('http://a.b')).toBe(true);
    expect(isWebUrl('grovs.link/x')).toBe(false);
    expect(isWebUrl('https://')).toBe(false);
  });
});

describe('openCommand', () => {
  it('builds the adb command', () => {
    expect(openCommand('https://grovs.link/x', 'android')).toBe(
      `adb shell "am start -a android.intent.action.VIEW -d 'https://grovs.link/x' io.grovs.example"`
    );
  });

  it('builds the simctl command', () => {
    expect(openCommand('https://grovs.link/x', 'ios')).toBe(
      `xcrun simctl openurl booted 'https://grovs.link/x'`
    );
  });

  it('quotes characters the shells would read', () => {
    expect(openCommand(`https://grovs.link/x?a=1&b=it's`, 'android')).toBe(
      `adb shell "am start -a android.intent.action.VIEW -d 'https://grovs.link/x?a=1&b=it'\\\\''s' io.grovs.example"`
    );
    expect(openCommand('https://grovs.link/x?a=$HOME', 'android')).toBe(
      `adb shell "am start -a android.intent.action.VIEW -d 'https://grovs.link/x?a=\\$HOME' io.grovs.example"`
    );
    expect(openCommand(`https://grovs.link/x?b=it's`, 'ios')).toBe(
      `xcrun simctl openurl booted 'https://grovs.link/x?b=it'\\''s'`
    );
  });
});

describe('flatten', () => {
  it('flattens nested maps', () => {
    expect(
      flatten({
        title: 'T',
        data: { level: 3, tags: ['a', 'b'] },
        none: null,
      })
    ).toEqual([
      ['title', 'T'],
      ['data.level', '3'],
      ['data.tags', 'a, b'],
      ['none', 'null'],
    ]);
  });
});
