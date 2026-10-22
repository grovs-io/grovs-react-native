import {
  DEFAULT_PROFILES,
  apiKeyError,
  baseUrlError,
  decodeProfiles,
  encodeProfiles,
  profileNameError,
  restartChanges,
  withDefaultProfile,
  type Profile,
} from '../profile';

const base: Profile = {
  id: 'p1',
  name: 'Demo',
  apiKey: 'key_1',
  test: false,
  baseUrl: 'https://sdk.grovs.link',
  autoTrack: true,
  startEnabled: true,
  clipboardDomains: [],
};

describe('restartChanges', () => {
  it('ignores the name', () => {
    expect(restartChanges(base, { ...base, name: 'Renamed' })).toEqual([]);
  });

  it('lists changed settings', () => {
    const changed = {
      ...base,
      test: true,
      clipboardDomains: ['a.com'],
      startEnabled: false,
    };
    expect(restartChanges(base, changed)).toEqual([
      'Environment',
      'Clipboard domains',
      'Start with SDK enabled',
    ]);
  });

  it('treats another profile as one change', () => {
    expect(
      restartChanges(base, { ...base, id: 'p2', apiKey: 'key_2' })
    ).toEqual(['Project']);
  });

  it('lists key, base URL and auto track', () => {
    expect(
      restartChanges(base, {
        ...base,
        apiKey: 'k',
        baseUrl: null,
        autoTrack: false,
      })
    ).toEqual(['API key', 'Base URL', 'Auto track screens']);
  });
});

describe('json', () => {
  it('round trips', () => {
    const profiles = [
      base,
      {
        ...base,
        id: 'p2',
        baseUrl: null,
        clipboardDomains: ['links.example.com'],
      },
    ];
    expect(decodeProfiles(encodeProfiles(profiles))).toEqual(profiles);
  });

  it('writes a blank base URL as null', () => {
    const [blank, empty] = JSON.parse(
      encodeProfiles([
        { ...base, baseUrl: '  ' },
        { ...base, baseUrl: '' },
      ])
    );
    expect(blank.baseUrl).toBeNull();
    expect(empty.baseUrl).toBeNull();
  });

  it('uses the stored field names', () => {
    expect(Object.keys(JSON.parse(encodeProfiles([base]))[0]).sort()).toEqual([
      'apiKey',
      'autoTrack',
      'baseUrl',
      'clipboardDomains',
      'id',
      'name',
      'startEnabled',
      'test',
    ]);
  });

  it('defaults missing optional fields', () => {
    const [p] = decodeProfiles(
      '[{"id":"a","name":"A","apiKey":"k","test":true}]'
    );
    expect(p).toEqual({
      id: 'a',
      name: 'A',
      apiKey: 'k',
      test: true,
      baseUrl: null,
      autoTrack: true,
      startEnabled: true,
      clipboardDomains: [],
    });
  });

  it('throws on invalid JSON', () => {
    expect(() => decodeProfiles('nope')).toThrow();
  });
});

describe('validation', () => {
  it('has valid defaults', () => {
    expect(new Set(DEFAULT_PROFILES.map((p) => p.id)).size).toBe(
      DEFAULT_PROFILES.length
    );
    DEFAULT_PROFILES.forEach((p) => {
      expect(profileNameError(p.name)).toBeNull();
      expect(apiKeyError(p.apiKey)).toBeNull();
      expect(baseUrlError(p.baseUrl ?? '')).toBeNull();
    });
    expect(DEFAULT_PROFILES[0]).toMatchObject({
      id: 'grovs-test',
      name: 'Grovs test',
      test: true,
      baseUrl: null,
    });
  });

  it('validates settings', () => {
    expect(profileNameError(' ')).not.toBeNull();
    expect(apiKeyError('')).not.toBeNull();
    expect(baseUrlError('')).toBeNull();
    expect(baseUrlError('https://staging.grovs.io')).toBeNull();
    expect(baseUrlError('staging.grovs.io')).not.toBeNull();
  });
});

describe('withDefaultProfile', () => {
  it('restores the default profile', () => {
    const [fallback] = DEFAULT_PROFILES;
    const broken = { ...fallback!, baseUrl: 'staging.grovs.io' };
    expect(withDefaultProfile([broken, base])).toEqual([fallback, base]);
    expect(withDefaultProfile([base])).toEqual([fallback, base]);
  });
});
