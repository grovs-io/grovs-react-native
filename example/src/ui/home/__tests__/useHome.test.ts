import { act, renderHook } from '@testing-library/react-native';
import Grovs from 'react-native-grovs-wrapper';
import { appLog } from '../../../actions/testLog';
import { settingsStore } from '../../../store/settingsStore';
import { useHome } from '../useHome';

const mockValues: Record<string, string> = {};

jest.mock('../../../store/exampleStore', () => ({
  NativeKeys: jest.requireActual('../../../store/exampleStore').NativeKeys,
  exampleStore: {
    get: (key: string) => mockValues[key],
    set: (key: string, value: string | null) => {
      if (value === null) delete mockValues[key];
      else mockValues[key] = value;
    },
    get startedProfile() {
      return { name: 'Grovs test', startEnabled: true };
    },
  },
}));

jest.mock('react-native-grovs-wrapper', () => ({
  __esModule: true,
  default: {
    setIdentifier: jest.fn(),
    setAttributes: jest.fn(),
    setSDK: jest.fn(),
    generateLink: jest.fn(() => Promise.resolve('https://grovs.link/abc')),
  },
}));

const grovs = jest.mocked(Grovs);

beforeEach(() => {
  Object.keys(mockValues).forEach((key) => delete mockValues[key]);
  jest.clearAllMocks();
  appLog.clear();
});

describe('useHome', () => {
  it('follows the link form saved by another screen', async () => {
    const { result } = renderHook(() => useHome());
    act(() => {
      settingsStore.linkForm = {
        ...settingsStore.linkForm,
        title: 'From Links',
      };
    });
    await act(async () => result.current.generate());
    expect(grovs.generateLink.mock.calls[0]![0]).toBe('From Links');
  });

  it('blocks generate while the saved link form has a bad URL', () => {
    const { result } = renderHook(() => useHome());
    expect(result.current.generateError).toBeNull();
    act(() => {
      settingsStore.linkForm = { ...settingsStore.linkForm, imageUrl: 'x' };
    });
    expect(result.current.generateError).toBe(
      'Image URL must start with http:// or https://'
    );
  });

  it('starts from the saved identity', () => {
    settingsStore.identity = {
      identifier: 'saved_user',
      attributes: [{ key: 'plan', value: 'pro', type: 'text' }],
    };
    const { result } = renderHook(() => useHome());
    expect(result.current.identity.identifier).toBe('saved_user');
    expect(result.current.attributesSummary).toBe('plan');
  });

  it('saves the identifier and sends it to the SDK once', () => {
    const { result } = renderHook(() => useHome());
    act(() => result.current.startEditing());
    act(() =>
      result.current.setDraft({
        identifier: 'qa_user_1',
        attributes: [{ key: 'plan', value: 'pro', type: 'text' }],
      })
    );
    act(() => result.current.saveIdentity());
    expect(settingsStore.identity.identifier).toBe('qa_user_1');
    expect(grovs.setIdentifier).toHaveBeenCalledTimes(1);
    expect(grovs.setIdentifier).toHaveBeenCalledWith('qa_user_1');
    expect(grovs.setAttributes).toHaveBeenCalledWith({ plan: 'pro' });
    expect(result.current.editing).toBe(false);
    expect(result.current.identity.identifier).toBe('qa_user_1');
  });

  it('sends undefined for None', () => {
    const { result } = renderHook(() => useHome());
    act(() => result.current.startEditing());
    act(() => result.current.setDraft({ identifier: '', attributes: [] }));
    act(() => result.current.saveIdentity());
    expect(grovs.setIdentifier).toHaveBeenCalledWith(undefined);
    expect(settingsStore.identity.identifier).toBe('');
  });

  it('cancel keeps the saved identity', () => {
    const { result } = renderHook(() => useHome());
    const before = result.current.identity;
    act(() => result.current.startEditing());
    act(() => result.current.setDraft({ identifier: 'x', attributes: [] }));
    act(() => result.current.cancelEditing());
    expect(result.current.identity).toEqual(before);
    expect(grovs.setIdentifier).not.toHaveBeenCalled();
  });

  it('labels quick actions from the saved forms', () => {
    settingsStore.eventForm = { name: 'signup', properties: [], tags: [] };
    const { result } = renderHook(() => useHome());
    expect(result.current.labels).toEqual({
      generate: 'Generate link',
      clipboard: 'Open clipboard',
      track: 'Track signup',
      purchase: 'Log $4.99 buy',
    });
  });

  it('updates labels after a form is saved', () => {
    const { result } = renderHook(() => useHome());
    act(() =>
      result.current.savePurchaseForm({
        ...settingsStore.purchaseForm,
        amount: '9.99',
        currency: 'EUR',
      })
    );
    expect(result.current.labels.purchase).toBe('Log €9.99 buy');
    expect(settingsStore.purchaseForm.amount).toBe('9.99');
  });

  it('turns the SDK off and remembers it', () => {
    const { result } = renderHook(() => useHome());
    expect(result.current.sdkEnabled).toBe(true);
    act(() => result.current.setSdkEnabled(false));
    expect(grovs.setSDK).toHaveBeenCalledWith(false);
    expect(settingsStore.sdkEnabled).toBe(false);
    expect(result.current.sdkEnabled).toBe(false);
  });
});
