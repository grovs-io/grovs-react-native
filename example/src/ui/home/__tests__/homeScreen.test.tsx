import { act, fireEvent, render, screen } from '@testing-library/react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Linking } from 'react-native';
import Grovs from 'react-native-grovs-wrapper';
import { appLog } from '../../../actions/testLog';
import { NavContext, type Nav } from '../../nav';
import { HomeScreen } from '../HomeScreen';

const mockValues: Record<string, string> = {};

jest.mock('../../../store/exampleStore', () => ({
  NativeKeys: jest.requireActual('../../../store/exampleStore').NativeKeys,
  exampleStore: {
    get: (key: string) => mockValues[key],
    set: (key: string, value: string | null) => {
      if (value === null) delete mockValues[key];
      else mockValues[key] = value;
    },
    fetchPushToken: () => Promise.resolve(null),
    get startedProfile() {
      return { name: 'Grovs test', test: true, startEnabled: true };
    },
  },
}));

jest.mock('react-native-grovs-wrapper', () => ({
  __esModule: true,
  default: {
    setIdentifier: jest.fn(),
    setAttributes: jest.fn(),
    track: jest.fn(),
  },
}));

const nav: Nav = {
  openSettings: jest.fn(),
  closeSettings: jest.fn(),
  openExcluded: jest.fn(),
  closeExcluded: jest.fn(),
  openLogs: jest.fn(),
};

function renderHome() {
  return render(
    <NavContext.Provider value={nav}>
      <HomeScreen />
    </NavContext.Provider>
  );
}

const press = (text: string) =>
  act(async () => {
    fireEvent.press(screen.getByText(text));
  });

beforeEach(() => {
  Object.keys(mockValues).forEach((key) => delete mockValues[key]);
  jest.clearAllMocks();
  appLog.clear();
});

describe('HomeScreen', () => {
  it('shows the saved values on the quick actions and runs track', async () => {
    renderHome();
    expect(screen.getByText('Log $4.99 buy')).toBeTruthy();
    await press('Track demo_tapped');
    expect(Grovs.track).toHaveBeenCalledWith(
      'demo_tapped',
      undefined,
      undefined
    );
  });

  it('changes the identity in place', async () => {
    renderHome();
    expect(screen.getByText('React native id')).toBeTruthy();
    fireEvent.press(screen.getByText('Change'));
    fireEvent.press(screen.getByText('qa_user_1'));
    await press('Save');
    expect(Grovs.setIdentifier).toHaveBeenCalledWith('qa_user_1');
    expect(screen.getByText('qa_user_1')).toBeTruthy();
    expect(screen.getByText('Change')).toBeTruthy();
  });

  it('shows the last link open and opens it in the logs panel', () => {
    renderHome();
    expect(screen.getByText('Not opened from a link yet')).toBeTruthy();
    let id = 0;
    act(() => {
      id = appLog.recordLinkOpen('https://grovs.link/abc').id;
    });
    expect(screen.getByText('just now')).toBeTruthy();
    fireEvent.press(screen.getByText('https://grovs.link/abc'));
    expect(nav.openLogs).toHaveBeenCalledWith(id);
  });

  it('says so when the clipboard has no link', async () => {
    jest.spyOn(Clipboard, 'getString').mockResolvedValue('hello');
    const open = jest.spyOn(Linking, 'openURL');
    renderHome();
    await press('Open clipboard');
    expect(open).not.toHaveBeenCalled();
  });
});
