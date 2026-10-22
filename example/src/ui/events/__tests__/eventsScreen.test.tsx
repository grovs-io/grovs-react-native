import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react-native';
import { Platform } from 'react-native';
import Grovs from 'react-native-grovs-wrapper';
import { appLog } from '../../../actions/testLog';
import { DEFAULT_EVENT_FORM } from '../../../data/forms';
import { settingsStore } from '../../../store/settingsStore';
import { useHome } from '../../home/useHome';
import { EventsScreen } from '../EventsScreen';

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
      return null;
    },
  },
}));

jest.mock('react-native-grovs-wrapper', () => ({
  __esModule: true,
  default: {
    track: jest.fn(),
    trackScreenView: jest.fn(),
    setGlobalTags: jest.fn(),
    setScreenAliases: jest.fn(),
    logCustomPurchase: jest.fn(),
    logInAppPurchase: jest.fn(),
  },
}));

const grovs = jest.mocked(Grovs);

const press = (text: string) =>
  act(async () => {
    fireEvent.press(screen.getByText(text));
  });

/** The event Track button comes first, the screen view one second. */
const pressTrack = (index: 0 | 1) =>
  act(async () => {
    fireEvent.press(screen.getAllByText('Track')[index]!);
  });

const PURCHASE_LABEL = 'Log $4.99 buy · USD · pro_monthly';

beforeEach(() => {
  Object.keys(mockValues).forEach((key) => delete mockValues[key]);
  jest.clearAllMocks();
  appLog.clear();
  grovs.logCustomPurchase.mockResolvedValue(true);
  grovs.logInAppPurchase.mockResolvedValue(true);
});

describe('EventsScreen', () => {
  it('tracks the default event', async () => {
    render(<EventsScreen />);
    await pressTrack(0);
    expect(grovs.track).toHaveBeenCalledWith(
      'demo_tapped',
      undefined,
      undefined
    );
  });

  it('picks a suggested name and saves it', async () => {
    render(<EventsScreen />);
    await press('level_up');
    expect(settingsStore.eventForm.name).toBe('level_up');
    await pressTrack(0);
    expect(grovs.track).toHaveBeenCalledWith('level_up', undefined, undefined);
  });

  it('blocks a reserved name and offers Send anyway', async () => {
    render(<EventsScreen />);
    fireEvent.changeText(screen.getByDisplayValue('demo_tapped'), 'install');
    const error = '"install" is reserved by the SDK';
    const [fieldError, button] = screen.getAllByText(error);
    expect(fieldError).toBeTruthy();
    await act(async () => {
      fireEvent.press(button!);
    });
    expect(grovs.track).not.toHaveBeenCalled();
    await press('Send anyway');
    expect(grovs.track).toHaveBeenCalledWith('install', undefined, undefined);
    expect(appLog.entries()[0]!.state).toBe('warning');
  });

  it('tracks a screen picked from the chips', async () => {
    render(<EventsScreen />);
    await press('Links');
    await pressTrack(1);
    expect(grovs.trackScreenView).toHaveBeenCalledWith('Links', undefined);
  });

  it('opens screen properties on a long press of Track', async () => {
    render(<EventsScreen />);
    await act(async () => {
      fireEvent(screen.getAllByText('Track')[1]!, 'longPress');
    });
    expect(screen.getByText('Screen properties')).toBeTruthy();
  });

  it('applies global tags as they change and keeps them', async () => {
    render(<EventsScreen />);
    await press('Global tags');
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('globalTagsField'), 'beta,');
    });
    expect(grovs.setGlobalTags).toHaveBeenCalledWith(['beta']);
    expect(settingsStore.globalTags).toEqual(['beta']);
  });

  it('applies screen aliases on Apply and keeps them', async () => {
    render(<EventsScreen />);
    expect(screen.getByText('Home → Home screen')).toBeTruthy();
    await press('Screen aliases');
    fireEvent.changeText(screen.getByDisplayValue('Home screen'), 'Start');
    expect(grovs.setScreenAliases).not.toHaveBeenCalled();
    await press('Apply aliases');
    expect(grovs.setScreenAliases).toHaveBeenCalledWith({ Home: 'Start' });
    expect(settingsStore.screenAliases[0]!.value).toBe('Start');
  });

  it('logs the folded purchase in one tap', async () => {
    render(<EventsScreen />);
    expect(screen.queryByText('Currency')).toBeNull();
    await press(PURCHASE_LABEL);
    expect(grovs.logCustomPurchase).toHaveBeenCalledWith(
      'buy',
      499,
      'USD',
      'pro_monthly',
      undefined
    );
  });

  it('expands the purchase form and sends a start date', async () => {
    render(<EventsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Edit purchase'));
    });
    await press('Refund');
    await press('Start date');
    await press('30 days ago');
    await press('Log $4.99 refund · USD · pro_monthly');
    const startDate = grovs.logCustomPurchase.mock.calls[0]![4];
    expect(typeof startDate).toBe('string');
    const days = (Date.now() - Date.parse(startDate!)) / 86_400_000;
    expect(Math.round(days)).toBe(30);
  });

  it('logs a store purchase for this platform', async () => {
    render(<EventsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Edit purchase'));
    });
    const ios = Platform.OS === 'ios';
    await press(ios ? 'App Store transaction' : 'Google Play purchase JSON');
    fireEvent.changeText(screen.getByTestId('storePurchaseField'), '2000001');
    await press(ios ? 'Log App Store purchase' : 'Log Play purchase');
    expect(grovs.logInAppPurchase).toHaveBeenCalledWith(
      ios ? { transactionId: '2000001' } : { originalJson: '2000001' }
    );
  });

  it('shows an event form saved from Home while mounted', () => {
    const home = renderHook(() => useHome());
    render(<EventsScreen />);
    act(() =>
      home.result.current.saveEventForm({
        ...DEFAULT_EVENT_FORM,
        name: 'from_home',
      })
    );
    expect(screen.getByDisplayValue('from_home')).toBeTruthy();
  });

  it('gives Home the forms edited here', async () => {
    const home = renderHook(() => useHome());
    render(<EventsScreen />);
    fireEvent.changeText(screen.getByDisplayValue('demo_tapped'), 'from_tab');
    expect(home.result.current.labels.track).toBe('Track from_tab');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Edit purchase'));
    });
    await press('Cancel');
    expect(home.result.current.labels.purchase).toBe('Log $4.99 cancel');
  });
});
