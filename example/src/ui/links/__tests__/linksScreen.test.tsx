import { act, fireEvent, render, screen } from '@testing-library/react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Linking, Platform, Share } from 'react-native';
import Grovs from 'react-native-grovs-wrapper';
import { renderHook } from '@testing-library/react-native';
import { appLog } from '../../../actions/testLog';
import { DEFAULT_LINK_FORM } from '../../../data/forms';
import { openCommand } from '../../../data/linkTools';
import { settingsStore } from '../../../store/settingsStore';
import { useHome } from '../../home/useHome';
import { NavContext, type Nav } from '../../nav';
import { LinksScreen } from '../LinksScreen';

const mockValues: Record<string, string> = {};

jest.mock('../../../store/exampleStore', () => ({
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
  default: { generateLink: jest.fn(), linkDetails: jest.fn() },
}));

jest.mock('react-native-qrcode-svg', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ value }: { value: string }) => <Text>{`QR ${value}`}</Text>;
});

const LINK = 'https://grovs.link/abc';
const generateLink = jest.mocked(Grovs.generateLink);
const linkDetails = jest.mocked(Grovs.linkDetails);

const nav: Nav = {
  openSettings: jest.fn(),
  closeSettings: jest.fn(),
  openExcluded: jest.fn(),
  closeExcluded: jest.fn(),
  openLogs: jest.fn(),
};

function renderLinks() {
  return render(
    <NavContext.Provider value={nav}>
      <LinksScreen />
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
  generateLink.mockResolvedValue(LINK);
  linkDetails.mockResolvedValue({ path: 'abc', title: 'Promo' });
});

describe('LinksScreen', () => {
  it('generates a link and shows it on a green card', async () => {
    renderLinks();
    expect(
      screen.getByText('UTM off · no tags · no image · no redirects')
    ).toBeTruthy();
    await press('Generate link');
    expect(generateLink).toHaveBeenCalledTimes(1);
    expect(screen.getByText(LINK)).toBeTruthy();
    expect(screen.getByText(/^Created · /)).toBeTruthy();
  });

  it('saves each edit right away', () => {
    renderLinks();
    fireEvent.changeText(screen.getByDisplayValue('Test title'), 'Edited');
    expect(settingsStore.linkForm.title).toBe('Edited');
    expect(settingsStore.linkForm.subtitle).toBe('Test subtitle');
  });

  it('shows a form saved from Home while mounted', () => {
    const home = renderHook(() => useHome());
    renderLinks();
    act(() =>
      home.result.current.saveLinkForm({
        ...DEFAULT_LINK_FORM,
        title: 'From Home',
      })
    );
    expect(screen.getByDisplayValue('From Home')).toBeTruthy();
  });

  it('gives Home the form edited here', () => {
    const home = renderHook(() => useHome());
    renderLinks();
    fireEvent.changeText(screen.getByDisplayValue('Test title'), 'From Links');
    expect(home.result.current.linkForm.title).toBe('From Links');
  });

  it('copies the link and the open command', async () => {
    renderLinks();
    await press('Generate link');
    await press('Copy');
    expect(Clipboard.setString).toHaveBeenLastCalledWith(LINK);
    await press(Platform.OS === 'android' ? 'adb' : 'simctl');
    expect(Clipboard.setString).toHaveBeenLastCalledWith(
      openCommand(LINK, Platform.OS as 'ios' | 'android')
    );
  });

  it('shares and opens the link', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({
      action: 'sharedAction',
    });
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    renderLinks();
    await press('Generate link');
    await press('Share');
    expect(share).toHaveBeenCalledWith({ message: LINK });
    await press('Open');
    expect(open).toHaveBeenCalledWith(LINK);
  });

  it('shows the QR sheet for the link', async () => {
    renderLinks();
    await press('Generate link');
    await press('QR');
    expect(screen.getByText(`QR ${LINK}`)).toBeTruthy();
    expect(screen.getByText('Copy link')).toBeTruthy();
  });

  it('runs the same call again from the card', async () => {
    renderLinks();
    await press('Generate link');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Run again'));
    });
    expect(generateLink).toHaveBeenCalledTimes(2);
  });

  it('shows the full error on a red card', async () => {
    generateLink.mockRejectedValue(
      Object.assign(new Error('Invalid API key'), { code: 'E_GROVS' })
    );
    renderLinks();
    await press('Generate link');
    expect(screen.getByText('Failed')).toBeTruthy();
    expect(screen.getByText('E_GROVS: Invalid API key')).toBeTruthy();
  });

  it('blocks Generate and says why when a URL is invalid', async () => {
    mockValues.linkForm = JSON.stringify({
      ...DEFAULT_LINK_FORM,
      imageUrl: 'not a url',
    });
    renderLinks();
    expect(
      screen.getByText('Image URL must start with http:// or https://')
    ).toBeTruthy();
    await press('Generate link');
    expect(generateLink).not.toHaveBeenCalled();
  });

  it('inspects a pasted link and opens the entry in the logs panel', async () => {
    renderLinks();
    const field = screen.getByPlaceholderText('Paste a link to inspect');
    fireEvent.changeText(field, `${LINK}?x=1`);
    await act(async () => {
      fireEvent(field, 'submitEditing');
    });
    expect(linkDetails).toHaveBeenCalledWith('abc');
    const entry = appLog.entries()[0]!;
    expect(entry).toMatchObject({
      type: 'INSPECT',
      detail: expect.stringContaining('Promo · abc'),
    });
    expect(nav.openLogs).toHaveBeenCalledWith(entry.id);
  });

  it('inspects the generated link from the card', async () => {
    renderLinks();
    await press('Generate link');
    await press('Inspect');
    expect(linkDetails).toHaveBeenCalledWith('abc');
    expect(nav.openLogs).toHaveBeenCalledWith(appLog.entries()[0]!.id);
  });

  it('does nothing on Done with an empty inspect field', async () => {
    renderLinks();
    await act(async () => {
      fireEvent(
        screen.getByPlaceholderText('Paste a link to inspect'),
        'submitEditing'
      );
    });
    expect(appLog.entries()).toHaveLength(0);
    expect(nav.openLogs).not.toHaveBeenCalled();
  });

  it('resets the form to the samples', async () => {
    mockValues.linkForm = JSON.stringify({
      ...DEFAULT_LINK_FORM,
      title: 'Mine',
    });
    renderLinks();
    expect(screen.getByDisplayValue('Mine')).toBeTruthy();
    await press('Reset');
    expect(screen.getByDisplayValue('Test title')).toBeTruthy();
    expect(JSON.parse(mockValues.linkForm!).title).toBe('Test title');
  });
});
