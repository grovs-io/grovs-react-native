import { callCode, render } from '../callCode';

describe('callCode', () => {
  it('renders a call without arguments', () => {
    expect(callCode('pauseInAppMessages', [])).toBe('pauseInAppMessages()');
  });

  it('renders arguments', () => {
    expect(
      callCode('track', [
        ['name', 'demo'],
        ['tags', ['qa', 'android']],
        ['properties', null],
      ])
    ).toBe(
      'track(\n  name = "demo",\n  tags = ["qa", "android"],\n  properties = null\n)'
    );
  });

  it('renders nested maps', () => {
    expect(callCode('send', [['data', { level: 3, vip: true }]])).toBe(
      'send(\n  data = {\n    level: 3,\n    vip: true\n  }\n)'
    );
  });

  it('renders an empty map', () => {
    expect(render({})).toBe('{}');
  });

  it('renders undefined as null', () => {
    expect(render(undefined)).toBe('null');
  });
});
