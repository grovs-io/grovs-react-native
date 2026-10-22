const mockStore = {
  value: undefined as string | undefined,
  get: jest.fn(),
  set: jest.fn(),
};
jest.mock('../../store/exampleStore', () => ({ exampleStore: mockStore }));

import type { LogEntry } from '../log';
const { storeLinkHistory } =
  require('../testLog') as typeof import('../testLog');

const link: LogEntry = {
  id: 3,
  time: 10,
  type: 'LINK',
  state: 'ok',
  title: 'Opened from link',
  detail: 'a',
  code: 'c',
  link: 'https://grovs.link/a',
  fromLink: true,
};

beforeEach(() => {
  mockStore.value = undefined;
  mockStore.get.mockReset().mockImplementation(() => mockStore.value);
  mockStore.set.mockReset();
});

describe('storeLinkHistory', () => {
  it('round trips link entries under the linkHistory key', () => {
    storeLinkHistory.save([link]);
    const [key, json] = mockStore.set.mock.calls[0]!;
    expect(key).toBe('linkHistory');
    mockStore.value = json;
    expect(storeLinkHistory.load()).toEqual([{ ...link, id: 0 }]);
  });

  it('strips the action when saving', () => {
    const action = {
      type: 'LINK',
      title: 't',
      code: 'c',
      run: async () => ({ state: 'ok', detail: '' }),
    };
    storeLinkHistory.save([{ ...link, action } as LogEntry]);
    expect(JSON.parse(mockStore.set.mock.calls[0]![1])[0]).not.toHaveProperty(
      'action'
    );
  });

  it('returns nothing when nothing is saved', () => {
    expect(storeLinkHistory.load()).toEqual([]);
  });

  it('returns nothing for malformed JSON', () => {
    mockStore.value = '{oops';
    expect(storeLinkHistory.load()).toEqual([]);
  });

  it('returns nothing for non-array JSON', () => {
    mockStore.value = '{"a":1}';
    expect(storeLinkHistory.load()).toEqual([]);
  });
});
