import { act, fireEvent, render, screen } from '@testing-library/react-native';
import Grovs from 'react-native-grovs-wrapper';
import { appLog } from '../../../actions/testLog';
import { settingsStore } from '../../../store/settingsStore';
import { ExcludedScreen } from '../ExcludedScreen';
import { InAppScreen } from '../InAppScreen';

const mockValues: Record<string, string> = {};

jest.mock('../../../store/exampleStore', () => ({
  NativeKeys: jest.requireActual('../../../store/exampleStore').NativeKeys,
  exampleStore: {
    get: (key: string) => mockValues[key],
    set: (key: string, value: string | null) => {
      if (value === null) delete mockValues[key];
      else mockValues[key] = value;
    },
  },
}));

jest.mock('react-native-grovs-wrapper', () => ({
  __esModule: true,
  default: {
    track: jest.fn(),
    trackScreenView: jest.fn(),
    pauseInAppMessages: jest.fn(),
    resumeInAppMessages: jest.fn(),
    discardInAppMessages: jest.fn(),
    setInAppExcludedScreens: jest.fn(),
    setInAppDebugLogging: jest.fn(),
  },
}));

const grovs = jest.mocked(Grovs);

beforeEach(() => {
  Object.keys(mockValues).forEach((key) => delete mockValues[key]);
  jest.clearAllMocks();
  appLog.clear();
});

describe('InAppScreen', () => {
  it('triggers the default event', async () => {
    render(<InAppScreen />);
    await act(async () => {
      fireEvent.press(screen.getByText('Trigger'));
    });
    expect(grovs.track).toHaveBeenCalledWith(
      'demo_tapped',
      undefined,
      undefined
    );
  });

  it('pauses from the segment', async () => {
    render(<InAppScreen />);
    await act(async () => {
      fireEvent.press(screen.getByText('Paused'));
    });
    expect(grovs.pauseInAppMessages).toHaveBeenCalled();
  });
});

describe('ExcludedScreen', () => {
  it('reports the screen on open and Home on close', () => {
    const view = render(<ExcludedScreen />);
    expect(grovs.trackScreenView).toHaveBeenLastCalledWith('Excluded');
    view.unmount();
    expect(grovs.trackScreenView).toHaveBeenLastCalledWith('Home');
  });

  it('says messages are blocked when Excluded is in the list', () => {
    render(<ExcludedScreen />);
    expect(screen.getByText('In-app messages are blocked here')).toBeTruthy();
  });

  it('warns when Excluded is not in the list', () => {
    settingsStore.excludedScreens = ['Checkout'];
    render(<ExcludedScreen />);
    expect(
      screen.getByText('Not excluded: add Excluded to the list')
    ).toBeTruthy();
  });

  it('triggers the saved event', async () => {
    settingsStore.inAppTrigger = 'promo_seen';
    render(<ExcludedScreen />);
    await act(async () => {
      fireEvent.press(screen.getByText('Trigger promo_seen'));
    });
    expect(grovs.track).toHaveBeenCalledWith(
      'promo_seen',
      undefined,
      undefined
    );
  });
});
